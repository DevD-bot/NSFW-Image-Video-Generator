// ── Long Video Page (Clip Stitcher) ───────────────────────────────────────

async function renderLongVideo(container) {
    const defaultNeg = 'cartoon, anime, bad anatomy, deformed, ugly, blurry, watermark, worst quality, low quality';

    container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">⬛ Long Video</div>
        <div class="page-subtitle">Auto-generate multiple clips and stitch into one long video</div>
      </div>

      <div class="split-layout">
        <div class="split-controls">
          <div class="card">
            <div class="card-title"><span class="card-title-icon">✦</span>Prompt</div>
            <div class="form-group">
              <label class="form-label">Positive Prompt</label>
              <textarea id="lvPrompt" class="form-textarea" rows="5" placeholder="(photorealistic:1.3), beautiful woman, smooth motion, cinematic lighting, detailed skin texture, masterpiece"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Negative Prompt</label>
              <textarea id="lvNeg" class="form-textarea" rows="3">${defaultNeg}</textarea>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><span class="card-title-icon">⚙</span>Video Settings</div>

            <div class="form-group">
              <label class="form-label">Number of Clips</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="lvClips" min="2" max="20" value="6"
                  oninput="updateLvEstimate()" />
                <span class="range-value" id="lvClipsVal">6</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Frames per Clip</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="lvFrames" min="8" max="24" step="8" value="16"
                  oninput="updateLvEstimate()" />
                <span class="range-value" id="lvFramesVal">16</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">FPS</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="lvFps" min="4" max="16" step="2" value="8"
                  oninput="updateLvEstimate()" />
                <span class="range-value" id="lvFpsVal">8 fps</span>
              </div>
            </div>

            <div class="card" style="background:rgba(139,92,246,0.06);border-color:rgba(139,92,246,0.2);padding:14px;margin-top:4px">
              <div id="lvEstimate" style="font-size:13px;color:var(--accent-light);font-weight:600;margin-bottom:4px">~12 seconds total</div>
              <div style="font-size:11px;color:var(--text-muted)">Estimated render time: ~6 min on 3060 Ti</div>
            </div>

            <div class="section-divider">Resolution</div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Width</label>
                <select id="lvW" class="form-select">
                  <option selected>512</option><option>640</option><option>768</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Height</label>
                <select id="lvH" class="form-select">
                  <option>512</option><option selected>768</option><option>960</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Steps per Clip</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="lvSteps" min="10" max="30" value="20"
                  oninput="document.getElementById('lvStepsVal').textContent=this.value" />
                <span class="range-value" id="lvStepsVal">20</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="lvBtn" onclick="startLongVideo()">⬛ Generate Long Video</button>
        </div>

        <!-- Output -->
        <div>
          <div class="card" style="min-height:500px;display:flex;flex-direction:column;gap:16px">
            <div class="card-title"><span class="card-title-icon">⬛</span>Progress & Output</div>

            <div id="lvClipSteps" style="display:none">
              <div class="text-sm text-secondary" style="margin-bottom:8px">Clip generation progress:</div>
              <div class="clip-steps" id="lvClipStepsGrid"></div>
            </div>

            <div id="lvStatus" style="display:none;margin-bottom:4px">
              <div class="text-sm text-secondary" id="lvStatusText">Starting...</div>
              <div class="progress-bar-wrap" style="margin-top:8px">
                <div class="progress-bar" id="lvProgressBar" style="width:0%"></div>
              </div>
            </div>

            <div class="output-area" id="lvOutput" style="flex:1;min-height:300px">
              <div class="output-placeholder-icon" style="font-size:40px">⬛</div>
              <div class="text-secondary">Your long video will appear here</div>
            </div>

            <div id="lvActions" style="display:none;gap:10px"></div>
          </div>
        </div>
      </div>
    </div>
  `;

    updateLvEstimate();
}

function updateLvEstimate() {
    const clips = parseInt(document.getElementById('lvClips')?.value || 6);
    const frames = parseInt(document.getElementById('lvFrames')?.value || 16);
    const fps = parseInt(document.getElementById('lvFps')?.value || 8);
    const totalSec = (clips * frames / fps).toFixed(1);
    const renderMin = (clips * 1).toFixed(0);
    if (document.getElementById('lvClipsVal')) document.getElementById('lvClipsVal').textContent = clips;
    if (document.getElementById('lvFramesVal')) document.getElementById('lvFramesVal').textContent = frames;
    if (document.getElementById('lvFpsVal')) document.getElementById('lvFpsVal').textContent = fps + ' fps';
    if (document.getElementById('lvEstimate')) document.getElementById('lvEstimate').textContent = `~${totalSec} seconds total`;
}

let _lvRunning = false;

async function startLongVideo() {
    if (_lvRunning) return;
    const prompt = document.getElementById('lvPrompt').value.trim();
    if (!prompt) { showToast('Please enter a prompt', 'error'); return; }

    _lvRunning = true;
    const btn = document.getElementById('lvBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    const numClips = parseInt(document.getElementById('lvClips').value);
    const framesPerClip = parseInt(document.getElementById('lvFrames').value);
    const fps = parseInt(document.getElementById('lvFps').value);

    // Build clip step indicators
    const stepsContainer = document.getElementById('lvClipSteps');
    const stepsGrid = document.getElementById('lvClipStepsGrid');
    stepsContainer.style.display = 'block';
    stepsGrid.innerHTML = Array.from({ length: numClips }, (_, i) =>
        `<div class="clip-step" id="clipStep${i}">${i + 1}</div>`
    ).join('');

    const statusDiv = document.getElementById('lvStatus');
    const statusText = document.getElementById('lvStatusText');
    const progressBar = document.getElementById('lvProgressBar');
    statusDiv.style.display = 'block';

    const output = document.getElementById('lvOutput');
    output.innerHTML = '<div class="spinner"></div><div class="text-secondary text-sm" style="margin-top:12px">Initializing...</div>';
    output.classList.remove('has-content');

    const body = {
        prompt,
        negative_prompt: document.getElementById('lvNeg').value,
        steps: parseInt(document.getElementById('lvSteps').value),
        cfg_scale: 7,
        width: parseInt(document.getElementById('lvW').value),
        height: parseInt(document.getElementById('lvH').value),
        sampler_name: 'Euler a',
        seed: -1,
        num_clips: numClips,
        frames_per_clip: framesPerClip,
        fps
    };

    try {
        const r = await fetch('/api/longvideo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lastData = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const evt = JSON.parse(line.slice(6));
                        lastData = evt;
                        if (evt.status === 'generating') {
                            document.querySelectorAll('.clip-step').forEach((el, i) => {
                                el.className = 'clip-step' + (i + 1 < evt.clip ? ' done' : i + 1 === evt.clip ? ' active' : '');
                            });
                            const pct = ((evt.clip - 1) / evt.total) * 80;
                            progressBar.style.width = pct + '%';
                            statusText.textContent = `Generating clip ${evt.clip} of ${evt.total}...`;
                        } else if (evt.status === 'clip_done') {
                            document.getElementById(`clipStep${evt.clip - 1}`)?.classList.remove('active');
                            document.getElementById(`clipStep${evt.clip - 1}`)?.classList.add('done');
                        } else if (evt.status === 'stitching') {
                            document.querySelectorAll('.clip-step').forEach(el => el.classList.add('done'));
                            progressBar.style.width = '95%';
                            statusText.textContent = 'Stitching clips together...';
                        } else if (evt.status === 'done') {
                            progressBar.style.width = '100%';
                            statusText.textContent = 'Done!';
                            output.innerHTML = `<video src="${evt.filename}?t=${Date.now()}" controls autoplay style="width:100%;height:100%;object-fit:contain;border-radius:10px"></video>`;
                            output.classList.add('has-content');
                            const actions = document.getElementById('lvActions');
                            actions.style.display = 'flex';
                            actions.innerHTML = `<button class="btn btn-secondary" onclick="downloadFile('${evt.filename}', 'silkdream_longvideo.mp4')">⬇ Download MP4</button>`;
                            showToast('Long video ready!', 'success');
                        } else if (evt.status === 'error') {
                            output.innerHTML = `<div style="color:var(--error);padding:20px;text-align:center">${evt.error}</div>`;
                            showToast('Error: ' + evt.error, 'error');
                        }
                    } catch { }
                }
            }
        }
    } catch (err) {
        output.innerHTML = `<div style="color:var(--error);padding:20px;text-align:center">Connection error. Is A1111 running?</div>`;
        showToast('Connection failed', 'error');
    }

    btn.disabled = false;
    btn.textContent = '⬛ Generate Long Video';
    _lvRunning = false;
}
