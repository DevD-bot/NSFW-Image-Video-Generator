// ── Generate Page (Text-to-Image) ──────────────────────────────────────────

async function renderGenerate(container) {
    let models = [];
    let samplers = [];
    try {
        [models, samplers] = await Promise.all([
            fetch('/api/models').then(r => r.json()),
            fetch('/api/samplers').then(r => r.json())
        ]);
    } catch { }

    const defaultNeg = 'cartoon, anime, illustration, 3d render, painting, bad anatomy, deformed, ugly, blurry, watermark, text, logo, worst quality, low quality, bad hands, extra fingers, mutated, disfigured';

    container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">✦ Generate Image</div>
        <div class="page-subtitle">Text-to-image via Automatic1111</div>
      </div>

      <div class="split-layout">
        <!-- Controls -->
        <div class="split-controls">
          <div class="card">
            <div class="card-title"><span class="card-title-icon">✦</span>Prompt</div>
            <div class="form-group">
              <label class="form-label">Positive Prompt</label>
              <textarea id="genPrompt" class="form-textarea" rows="5" placeholder="(photorealistic:1.3), RAW photo, 8k uhd, DSLR quality, sharp focus, professional lighting, perfect skin texture, beautiful woman, masterpiece, best quality"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Negative Prompt</label>
              <textarea id="genNeg" class="form-textarea" rows="3">${defaultNeg}</textarea>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><span class="card-title-icon">⚙</span>Settings</div>

            <div class="form-group">
              <label class="form-label">Model (Checkpoint)</label>
              <select id="genModel" class="form-select">
                ${models.map(m => `<option value="${m.title}">${m.title}</option>`).join('') || '<option value="">Default Model</option>'}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Sampler</label>
              <select id="genSampler" class="form-select">
                ${samplers.map(s => `<option${s.name === 'DPM++ 2M Karras' ? ' selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="section-divider">Resolution</div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Width</label>
                <select id="genWidth" class="form-select">
                  <option>512</option><option>640</option><option selected>768</option><option>832</option><option>1024</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Height</label>
                <select id="genHeight" class="form-select">
                  <option>512</option><option>640</option><option selected>1024</option><option>1152</option><option>1216</option>
                </select>
              </div>
            </div>

            <div class="section-divider">Parameters</div>

            <div class="form-group">
              <label class="form-label">Steps</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="genSteps" min="10" max="60" value="28" oninput="document.getElementById('genStepsVal').textContent=this.value" />
                <span class="range-value" id="genStepsVal">28</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">CFG Scale</label>
              <div class="range-wrapper">
                <input type="range" class="form-range" id="genCfg" min="1" max="15" step="0.5" value="7" oninput="document.getElementById('genCfgVal').textContent=this.value" />
                <span class="range-value" id="genCfgVal">7</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Seed (-1 = random)</label>
              <input type="number" class="form-input" id="genSeed" value="-1" />
            </div>

            <div class="section-divider">Hires Fix</div>

            <div class="toggle-row">
              <span class="toggle-label">Enable Hires Fix (2x upscale)</span>
              <label class="toggle"><input type="checkbox" id="genHires" /><span class="toggle-slider"></span></label>
            </div>
          </div>

          <button class="btn btn-primary btn-full" id="genBtn" onclick="startGenerate()">✦ Generate Image</button>
        </div>

        <!-- Output -->
        <div>
          <div class="card" style="height:100%;min-height:500px;display:flex;flex-direction:column">
            <div class="card-title" style="margin-bottom:16px"><span class="card-title-icon">◈</span>Output</div>

            <div class="output-area" id="genOutput" style="flex:1">
              <div class="output-placeholder-icon">✦</div>
              <div class="text-secondary">Your image will appear here</div>
            </div>

            <div id="genProgress" style="display:none;margin-top:16px">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span class="text-sm text-secondary" id="genProgressText">Generating...</span>
              </div>
              <div class="progress-bar-wrap"><div class="progress-bar" id="genProgressBar" style="width:0%"></div></div>
            </div>

            <div id="genActions" style="display:none;margin-top:16px;display:none;gap:10px">
              <button class="btn btn-secondary" id="genDownloadBtn">⬇ Download</button>
              <button class="btn btn-secondary" onclick="document.getElementById('genPrompt').value=window._lastGenPrompt||'';startGenerate()">↺ Regenerate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _genRunning = false;

async function startGenerate() {
    if (_genRunning) return;
    const prompt = document.getElementById('genPrompt').value.trim();
    if (!prompt) { showToast('Please enter a prompt', 'error'); return; }

    _genRunning = true;
    const btn = document.getElementById('genBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    const output = document.getElementById('genOutput');
    output.innerHTML = '<div class="spinner"></div><div class="text-secondary text-sm" style="margin-top:12px">This may take 20–60 seconds...</div>';
    output.classList.remove('has-content');

    const progress = document.getElementById('genProgress');
    const progressBar = document.getElementById('genProgressBar');
    const progressText = document.getElementById('genProgressText');
    progress.style.display = 'block';

    // Fake progress animation
    let pct = 0;
    const pTimer = setInterval(() => {
        pct = Math.min(pct + Math.random() * 3, 90);
        progressBar.style.width = pct + '%';
        progressText.textContent = `Generating... ${Math.round(pct)}%`;
    }, 500);

    try {
        const body = {
            prompt,
            negative_prompt: document.getElementById('genNeg').value,
            steps: parseInt(document.getElementById('genSteps').value),
            cfg_scale: parseFloat(document.getElementById('genCfg').value),
            width: parseInt(document.getElementById('genWidth').value),
            height: parseInt(document.getElementById('genHeight').value),
            sampler_name: document.getElementById('genSampler').value,
            seed: parseInt(document.getElementById('genSeed').value),
            enable_hr: document.getElementById('genHires').checked,
            hr_scale: 1.5,
            model: document.getElementById('genModel').value || null
        };

        const r = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await r.json();

        clearInterval(pTimer);
        progressBar.style.width = '100%';
        progressText.textContent = 'Done!';

        if (data.success) {
            window._lastGenPrompt = prompt;
            output.innerHTML = `<img src="data:image/png;base64,${data.image}" alt="Generated" style="width:100%;height:100%;object-fit:contain;border-radius:10px" />`;
            output.classList.add('has-content');

            const actions = document.getElementById('genActions');
            actions.style.display = 'flex';
            document.getElementById('genDownloadBtn').onclick = () => {
                downloadFile(`/${data.filename}`, `silkdream_${data.id}.png`);
            };
            showToast('Image generated!', 'success');
        } else {
            output.innerHTML = `<div style="color:var(--error);text-align:center;padding:20px">${data.error}</div>`;
            showToast(data.error, 'error');
        }
    } catch (err) {
        clearInterval(pTimer);
        output.innerHTML = `<div style="color:var(--error);text-align:center;padding:20px">Connection error. Is A1111 running?</div>`;
        showToast('Connection failed', 'error');
    }

    setTimeout(() => { progress.style.display = 'none'; }, 2000);
    btn.disabled = false;
    btn.textContent = '✦ Generate Image';
    _genRunning = false;
}
