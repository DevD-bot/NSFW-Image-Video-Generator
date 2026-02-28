// ── Animate Page (Short Video) ────────────────────────────────────────────

async function renderAnimate(container) {
    const defaultNeg = 'cartoon, anime, bad anatomy, deformed, ugly, blurry, watermark, worst quality, low quality';

    container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">▷ Short Video</div>
        <div class="page-subtitle">AnimateDiff — 2 to 4 second clips (8–24 frames)</div>
      </div>

      <div class="split-layout">
        <div class="split-controls">
          <div class="card">
            <div class="card-title"><span class="card-title-icon">✦</span>Prompt</div>
            <div class="form-group">
              <label class="form-label">Positive Prompt</label>
              <textarea id="animPrompt" class="form-textarea" rows="5" placeholder="(photorealistic:1.3), beautiful woman, natural lighting, smooth motion, detailed skin, masterpiece"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Negative Prompt</label>
              <textarea id="animNeg" class="form-textarea" rows="3">${defaultNeg}</textarea>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><span class="card-title-icon">⚙</span>Video Settings</div>

            <div class="form-group">
              <label class="form-label">Motion Module</label>
              <select id="animModule" class="form-select">
                <option value="mm_sd_v15_v3.ckpt">AnimateDiff v3 (SD1.5) — Recommended</option>
                <option value="mm_sdxl_v10_beta.ckpt">AnimateDiff SDXL (needs SDXL model)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Frame Count</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="animFrames" min="8" max="24" step="8" value="16"
                  oninput="document.getElementById('animFramesVal').textContent=this.value+' frames (~'+(this.value/8).toFixed(1)+'s)'" />
                <span class="range-value" id="animFramesVal">16 frames (~2.0s)</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">FPS</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="animFps" min="4" max="16" step="2" value="8"
                  oninput="document.getElementById('animFpsVal').textContent=this.value+' fps'" />
                <span class="range-value" id="animFpsVal">8 fps</span>
              </div>
            </div>

            <div class="section-divider">Image Settings</div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Width</label>
                <select id="animW" class="form-select">
                  <option selected>512</option><option>640</option><option>768</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Height</label>
                <select id="animH" class="form-select">
                  <option>512</option><option>640</option><option selected>768</option><option>960</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Steps</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="animSteps" min="10" max="40" value="20"
                  oninput="document.getElementById('animStepsVal').textContent=this.value" />
                <span class="range-value" id="animStepsVal">20</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">CFG Scale</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="animCfg" min="4" max="12" step="0.5" value="7"
                  oninput="document.getElementById('animCfgVal').textContent=this.value" />
                <span class="range-value" id="animCfgVal">7</span>
              </div>
            </div>
          </div>

          <div class="card" style="background:rgba(139,92,246,0.05);border-color:rgba(139,92,246,0.2)">
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">
              <strong style="color:var(--accent-light)">💡 Requirements:</strong><br/>
              AnimateDiff extension must be installed in A1111.<br/>
              Use SD1.5 models (epiCRealism, CyberRealistic) with v3 module.<br/>
              Keep frames ≤ 16 for best performance on 8GB VRAM.
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="animBtn" onclick="startAnimate()">▷ Generate Video Clip</button>
        </div>

        <!-- Output -->
        <div>
          <div class="card" style="min-height:500px;display:flex;flex-direction:column">
            <div class="card-title" style="margin-bottom:16px"><span class="card-title-icon">▷</span>Output</div>

            <div class="output-area" id="animOutput" style="flex:1">
              <div class="output-placeholder-icon" style="font-size:40px">▷</div>
              <div class="text-secondary">Your video clip will appear here</div>
            </div>

            <div id="animProgress" style="display:none;margin-top:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span class="text-sm text-secondary" id="animProgressText">Generating animation...</span>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar" id="animProgressBar" style="width:0%"></div></div>
            </div>

            <div id="animActions" style="display:none;margin-top:16px;gap:10px"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _animRunning = false;

async function startAnimate() {
    if (_animRunning) return;
    const prompt = document.getElementById('animPrompt').value.trim();
    if (!prompt) { showToast('Please enter a prompt', 'error'); return; }

    _animRunning = true;
    const btn = document.getElementById('animBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Animating...';

    const output = document.getElementById('animOutput');
    output.innerHTML = '<div class="spinner"></div><div class="text-secondary text-sm" style="margin-top:12px">Generating frames... this may take 1–3 minutes</div>';
    output.classList.remove('has-content');

    const progress = document.getElementById('animProgress');
    progress.style.display = 'block';
    const progressBar = document.getElementById('animProgressBar');
    const progressText = document.getElementById('animProgressText');

    let pct = 0;
    const pTimer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 1.5, 90);
        progressBar.style.width = pct + '%';
        progressText.textContent = `Generating frames... ${Math.round(pct)}%`;
    }, 800);

    try {
        const body = {
            prompt,
            negative_prompt: document.getElementById('animNeg').value,
            steps: parseInt(document.getElementById('animSteps').value),
            cfg_scale: parseFloat(document.getElementById('animCfg').value),
            width: parseInt(document.getElementById('animW').value),
            height: parseInt(document.getElementById('animH').value),
            sampler_name: 'Euler a',
            seed: -1,
            video_length: parseInt(document.getElementById('animFrames').value),
            fps: parseInt(document.getElementById('animFps').value),
            motion_module: document.getElementById('animModule').value
        };

        const r = await fetch('/api/animate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json();

        clearInterval(pTimer);
        progressBar.style.width = '100%';

        if (data.success) {
            output.innerHTML = `<video src="${data.filename}?t=${Date.now()}" controls autoplay loop muted style="width:100%;height:100%;object-fit:contain;border-radius:10px"></video>`;
            output.classList.add('has-content');

            const actions = document.getElementById('animActions');
            actions.style.display = 'flex';
            actions.innerHTML = `<button class="btn btn-secondary" onclick="downloadFile('${data.filename}', 'silkdream_clip_${data.id}.mp4')">⬇ Download MP4</button>`;
            showToast('Video clip generated!', 'success');
        } else {
            output.innerHTML = `<div style="color:var(--error);padding:20px;text-align:center">${data.error}</div>`;
            showToast(data.error, 'error');
        }
    } catch {
        clearInterval(pTimer);
        output.innerHTML = `<div style="color:var(--error);padding:20px;text-align:center">Connection error. Is A1111 running with AnimateDiff?</div>`;
        showToast('Connection failed', 'error');
    }

    setTimeout(() => { progress.style.display = 'none'; }, 2000);
    btn.disabled = false;
    btn.textContent = '▷ Generate Video Clip';
    _animRunning = false;
}
