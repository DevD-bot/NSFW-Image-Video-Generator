const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const si = require('systeminformation');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 3000;
const A1111_URL = 'http://127.0.0.1:7860';

// Ensure output directories exist
const dirs = ['outputs/images', 'outputs/videos', 'outputs/clips'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// History file
const HISTORY_FILE = 'history.json';
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));

function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE)); }
  catch { return []; }
}
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));
app.use('/outputs', express.static('outputs'));

// ─── GET SYSTEM INFO ─────────────────────────────────────────────────────────
app.get('/api/system', async (req, res) => {
  try {
    const graphics = await si.graphics();
    const gpu = graphics.controllers[0];
    const vramGB = gpu && gpu.vram ? Math.max(1, Math.round(gpu.vram / 1024)) : 8;
    res.json({
      gpuName: gpu && gpu.model ? gpu.model : 'Unknown GPU',
      vram: `${vramGB} GB VRAM`
    });
  } catch (err) {
    res.json({ gpuName: 'RTX 3060 Ti', vram: '8 GB VRAM' });
  }
});

// ─── CHECK A1111 CONNECTION ──────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
  try {
    await axios.get(`${A1111_URL}/sdapi/v1/sd-models`, { timeout: 3000 });
    res.json({ connected: true });
  } catch {
    res.json({ connected: false });
  }
});

// ─── GET MODELS ──────────────────────────────────────────────────────────────
app.get('/api/models', async (req, res) => {
  try {
    const r = await axios.get(`${A1111_URL}/sdapi/v1/sd-models`);
    res.json(r.data);
  } catch {
    res.json([{ title: 'Demo Model (A1111 not running)', model_name: 'demo' }]);
  }
});

// ─── GET SAMPLERS ────────────────────────────────────────────────────────────
app.get('/api/samplers', async (req, res) => {
  try {
    const r = await axios.get(`${A1111_URL}/sdapi/v1/samplers`);
    res.json(r.data);
  } catch {
    res.json([{ name: 'DPM++ 2M Karras' }, { name: 'Euler a' }, { name: 'DDIM' }]);
  }
});

// ─── TEXT TO IMAGE ───────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const {
    prompt, negative_prompt = '',
    steps = 28, cfg_scale = 7, width = 512, height = 768,
    sampler_name = 'DPM++ 2M Karras', seed = -1,
    enable_hr = false, hr_scale = 1.5, hr_upscaler = 'R-ESRGAN 4x+',
    model = null
  } = req.body;

  try {
    // Switch model if requested
    if (model) {
      try {
        await axios.post(`${A1111_URL}/sdapi/v1/options`, {
          sd_model_checkpoint: model
        });
      } catch { }
    }

    const payload = {
      prompt, negative_prompt, steps, cfg_scale, width, height,
      sampler_name, seed, enable_hr, hr_scale, hr_upscaler,
      save_images: false
    };

    const r = await axios.post(`${A1111_URL}/sdapi/v1/txt2img`, payload, {
      timeout: 300000
    });

    const imageData = r.data.images[0];
    const id = uuidv4();
    const filename = `outputs/images/${id}.png`;
    fs.writeFileSync(filename, Buffer.from(imageData, 'base64'));

    // Save to history
    const history = loadHistory();
    const entry = {
      id, type: 'image', filename, prompt, negative_prompt,
      settings: { steps, cfg_scale, width, height, sampler_name, seed },
      createdAt: new Date().toISOString()
    };
    history.unshift(entry);
    saveHistory(history);

    res.json({ success: true, id, image: imageData, filename });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Generation failed. Is Automatic1111 running with --api flag?', details: err.message });
  }
});

// ─── ANIMATE (SHORT VIDEO) ────────────────────────────────────────────────────
app.post('/api/animate', async (req, res) => {
  const {
    prompt, negative_prompt = '',
    steps = 20, cfg_scale = 7, width = 512, height = 768,
    sampler_name = 'Euler a', seed = -1,
    video_length = 16, fps = 8,
    motion_module = 'mm_sd_v15_v3.ckpt'
  } = req.body;

  try {
    // AnimateDiff via A1111 extension API
    const payload = {
      prompt, negative_prompt, steps, cfg_scale, width, height,
      sampler_name, seed,
      alwayson_scripts: {
        AnimateDiff: {
          args: [{
            enable: true,
            model: motion_module,
            format: ['GIF', 'MP4'],
            video_length,
            fps,
            loop_number: 0,
            closed_loop: 'R+P',
            batch_size: 1,
            stride: 1,
            overlap: -1,
            interp: 'Off',
            interp_x: 10,
            video_source: null,
            video_path: null,
            latent_power: 1,
            latent_scale: 32,
            last_frame: null,
            latent_power_last: 1,
            latent_scale_last: 32,
            request_id: ''
          }]
        }
      }
    };

    const r = await axios.post(`${A1111_URL}/sdapi/v1/txt2img`, payload, {
      timeout: 600000
    });

    const id = uuidv4();
    let videoBase64 = null;

    // AnimateDiff returns video in the response
    if (r.data.images && r.data.images.length > 1) {
      videoBase64 = r.data.images[r.data.images.length - 1];
    } else if (r.data.images && r.data.images[0]) {
      videoBase64 = r.data.images[0];
    }

    const filename = `outputs/clips/${id}.mp4`;
    if (videoBase64) {
      fs.writeFileSync(filename, Buffer.from(videoBase64, 'base64'));
    }

    const history = loadHistory();
    const entry = {
      id, type: 'video', filename, prompt, negative_prompt,
      settings: { steps, cfg_scale, width, height, video_length, fps },
      createdAt: new Date().toISOString()
    };
    history.unshift(entry);
    saveHistory(history);

    res.json({ success: true, id, filename: `/${filename}` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Animation failed. Ensure AnimateDiff extension is installed.', details: err.message });
  }
});

// ─── LONG VIDEO (AUTO STITCH) ─────────────────────────────────────────────────
app.post('/api/longvideo', async (req, res) => {
  const {
    prompt, negative_prompt = '',
    steps = 20, cfg_scale = 7, width = 512, height = 768,
    sampler_name = 'Euler a', seed = -1,
    num_clips = 4, frames_per_clip = 16, fps = 8,
    motion_module = 'mm_sd_v15_v3.ckpt'
  } = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const clipFiles = [];
  const videoId = uuidv4();

  try {
    for (let i = 0; i < num_clips; i++) {
      send({ status: 'generating', clip: i + 1, total: num_clips });

      const clipSeed = seed === -1 ? Math.floor(Math.random() * 2147483647) : seed + i;

      const payload = {
        prompt, negative_prompt, steps, cfg_scale, width, height,
        sampler_name, seed: clipSeed,
        alwayson_scripts: {
          AnimateDiff: {
            args: [{
              enable: true,
              model: motion_module,
              format: ['MP4'],
              video_length: frames_per_clip,
              fps,
              loop_number: 0,
              closed_loop: 'R+P',
              batch_size: 1,
              stride: 1,
              overlap: -1,
              interp: 'Off',
              interp_x: 10,
              video_source: null,
              video_path: null,
              latent_power: 1,
              latent_scale: 32,
              last_frame: null,
              latent_power_last: 1,
              latent_scale_last: 32,
              request_id: ''
            }]
          }
        }
      };

      const r = await axios.post(`${A1111_URL}/sdapi/v1/txt2img`, payload, {
        timeout: 600000
      });

      if (r.data.images && r.data.images.length > 0) {
        const clipFile = `outputs/clips/${videoId}_clip${i}.mp4`;
        const vidData = r.data.images[r.data.images.length - 1];
        fs.writeFileSync(clipFile, Buffer.from(vidData, 'base64'));
        clipFiles.push(clipFile);
        send({ status: 'clip_done', clip: i + 1, total: num_clips });
      }
    }

    // Stitch clips together
    send({ status: 'stitching' });
    const outputFile = `outputs/videos/${videoId}.mp4`;
    const listFile = `outputs/clips/${videoId}_list.txt`;
    const listContent = clipFiles.map(f => `file '${path.resolve(f)}'`).join('\n');
    fs.writeFileSync(listFile, listContent);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .output(outputFile)
        .outputOptions(['-c', 'copy'])
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Cleanup temp files
    clipFiles.forEach(f => { try { fs.unlinkSync(f); } catch { } });
    try { fs.unlinkSync(listFile); } catch { }

    // Save to history
    const history = loadHistory();
    history.unshift({
      id: videoId, type: 'longvideo',
      filename: outputFile, prompt, negative_prompt,
      settings: { steps, cfg_scale, width, height, num_clips, frames_per_clip, fps },
      createdAt: new Date().toISOString()
    });
    saveHistory(history);

    send({ status: 'done', filename: `/${outputFile}`, id: videoId });
    res.end();
  } catch (err) {
    send({ status: 'error', error: err.message });
    res.end();
  }
});

// ─── HISTORY ─────────────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => {
  res.json(loadHistory());
});

app.delete('/api/history/:id', (req, res) => {
  let history = loadHistory();
  const entry = history.find(h => h.id === req.params.id);
  if (entry) {
    try { fs.unlinkSync(entry.filename); } catch { }
    history = history.filter(h => h.id !== req.params.id);
    saveHistory(history);
  }
  res.json({ success: true });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🌸 ═══════════════════════════════════════════');
  console.log('   SilkDream is running!');
  console.log(`   → Open: http://localhost:${PORT}`);
  console.log('   → Make sure A1111 is running with --api flag');
  console.log('🌸 ═══════════════════════════════════════════\n');
});
