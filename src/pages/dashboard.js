// ── Dashboard Page ─────────────────────────────────────────────────────────

async function renderDashboard(container) {
  const history = await fetch('/api/history').then(r => r.json()).catch(() => []);
  const sysInfo = window.sysInfo || await fetch('/api/system').then(r => r.json()).catch(() => ({ gpuName: 'RTX 3060 Ti', vram: '8 GB VRAM' }));
  window.sysInfo = sysInfo;
  if (window.updateSidebarGpu) window.updateSidebarGpu(sysInfo);

  const images = history.filter(h => h.type === 'image').length;
  const videos = history.filter(h => h.type !== 'image').length;
  const recent = history.slice(0, 6);

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">✦ Welcome to SilkDream</div>
        <div class="page-subtitle">Your private local AI generation studio</div>
      </div>

      <div class="grid-4" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-label">Images Generated</div>
          <div class="stat-value">${images}</div>
          <div class="stat-sub">All time</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Videos Created</div>
          <div class="stat-value">${videos}</div>
          <div class="stat-sub">Clips + long videos</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">GPU</div>
          <div class="stat-value" style="font-size:20px;margin-top:4px">${sysInfo.gpuName}</div>
          <div class="stat-sub">${sysInfo.vram}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Storage</div>
          <div class="stat-value" style="font-size:20px;margin-top:4px">Local</div>
          <div class="stat-sub">100% private</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-title"><span class="card-title-icon">⚡</span>Quick Actions</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-primary" onclick="navigateTo('generate')">✦ Generate Image</button>
            <button class="btn btn-secondary" onclick="navigateTo('animate')">▷ Create Short Video</button>
            <button class="btn btn-secondary" onclick="navigateTo('longvideo')">⬛ Create Long Video</button>
            <button class="btn btn-secondary" onclick="navigateTo('gallery')">◈ View Gallery</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><span class="card-title-icon">📖</span>Recommended Setup</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
      ['Juggernaut XL v9', 'Best photorealistic model', 'badge-purple'],
      ['AnimateDiff v3', 'For short video clips', 'badge-rose'],
      ['ADetailer', 'Auto face enhancement', 'badge-green'],
      ['epiCRealism v5', 'Fast realistic generation', 'badge-purple'],
    ].map(([name, desc, badge]) => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${name}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${desc}</div>
                </div>
                <span class="badge ${badge}">✓ Installed</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      ${recent.length > 0 ? `
        <div class="card">
          <div class="card-title"><span class="card-title-icon">◈</span>Recent Generations</div>
          <div class="image-grid">
            ${recent.map(item => `
              <div class="image-card">
                ${item.type === 'image'
        ? `<img src="/${item.filename}?t=${Date.now()}" alt="generated" loading="lazy" onerror="this.style.display='none'">`
        : `<video src="/${item.filename}" muted loop autoplay playsinline></video>`
      }
                <div class="image-card-meta">
                  <div class="image-card-prompt">${item.prompt || 'No prompt'}</div>
                  <div class="image-card-actions">
                    <button class="icon-btn" onclick="downloadFile('/${item.filename}', '${item.id}.${item.type === 'image' ? 'png' : 'mp4'}')">⬇ Save</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">✦</div>
            <div class="empty-state-title">Ready to create</div>
            <div class="empty-state-sub">Your generations will appear here</div>
          </div>
        </div>
      `}
    </div>
  `;
}
