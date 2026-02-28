// ── Gallery Page ─────────────────────────────────────────────────────────

async function renderGallery(container) {
    container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div class="page-title">◈ Gallery</div>
            <div class="page-subtitle">All your generated images and videos</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <select id="galleryFilter" class="form-select" style="width:160px" onchange="filterGallery()">
              <option value="all">All</option>
              <option value="image">Images Only</option>
              <option value="video">Videos Only</option>
            </select>
            <button class="btn btn-danger" onclick="confirmClearAll()">🗑 Clear All</button>
          </div>
        </div>
      </div>

      <div id="galleryGrid"></div>
    </div>
  `;

    await loadGallery();
}

let _galleryData = [];

async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="flex-center" style="height:200px"><div class="spinner"></div></div>';

    try {
        _galleryData = await fetch('/api/history').then(r => r.json());
        filterGallery();
    } catch {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">◈</div><div class="empty-state-title">Could not load gallery</div></div>';
    }
}

function filterGallery() {
    const filter = document.getElementById('galleryFilter')?.value || 'all';
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const filtered = filter === 'all' ? _galleryData
        : filter === 'image' ? _galleryData.filter(h => h.type === 'image')
            : _galleryData.filter(h => h.type !== 'image');

    if (!filtered.length) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">◈</div>
        <div class="empty-state-title">No generations yet</div>
        <div class="empty-state-sub">Go to Generate or Animate to create content</div>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" onclick="navigateTo('generate')">✦ Generate Image</button>
          <button class="btn btn-secondary" onclick="navigateTo('animate')">▷ Short Video</button>
        </div>
      </div>
    `;
        return;
    }

    grid.innerHTML = `
    <div style="margin-bottom:16px;font-size:13px;color:var(--text-muted)">${filtered.length} item${filtered.length !== 1 ? 's' : ''}</div>
    <div class="image-grid">
      ${filtered.map(item => renderGalleryCard(item)).join('')}
    </div>
  `;
}

function renderGalleryCard(item) {
    const isImg = item.type === 'image';
    const ext = isImg ? 'png' : 'mp4';
    const media = isImg
        ? `<img src="/${item.filename}?t=${Date.now()}" alt="Generated" loading="lazy" onclick="openModal('${item.id}')" onerror="this.parentElement.querySelector('.img-fallback').style.display='flex'" /><div class="img-fallback flex-center" style="display:none;aspect-ratio:2/3;background:var(--bg-input);color:var(--text-muted);font-size:12px">Image missing</div>`
        : `<video src="/${item.filename}?t=${Date.now()}" muted loop autoplay playsinline onclick="openModal('${item.id}')"></video>`;

    const typeBadge = isImg
        ? '<span class="badge badge-purple">Image</span>'
        : item.type === 'longvideo'
            ? '<span class="badge badge-rose">Long Video</span>'
            : '<span class="badge badge-green">Clip</span>';

    return `
    <div class="image-card" id="card-${item.id}">
      ${media}
      <div class="image-card-meta">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          ${typeBadge}
          <span class="text-xs text-muted">${formatDate(item.createdAt)}</span>
        </div>
        <div class="image-card-prompt">${item.prompt || 'No prompt'}</div>
        <div class="image-card-actions">
          <button class="icon-btn" onclick="downloadFile('/${item.filename}', 'silkdream_${item.id}.${ext}')">⬇</button>
          <button class="icon-btn" onclick="reusePrompt('${item.id}')">↺</button>
          <button class="icon-btn" style="color:var(--error)" onclick="deleteItem('${item.id}')">🗑</button>
        </div>
      </div>
    </div>
  `;
}

function openModal(id) {
    const item = _galleryData.find(h => h.id === id);
    if (!item) return;
    const isImg = item.type === 'image';

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    backdrop.innerHTML = `
    <div class="modal" style="max-width:800px;position:relative">
      <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">✕</button>
      ${isImg
            ? `<img src="/${item.filename}" alt="" style="width:100%;border-radius:10px;margin-bottom:16px"/>`
            : `<video src="/${item.filename}" controls autoplay style="width:100%;border-radius:10px;margin-bottom:16px"></video>`
        }
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6">${item.prompt}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${Object.entries(item.settings || {}).map(([k, v]) =>
            `<span class="badge badge-purple">${k}: ${v}</span>`
        ).join('')}
      </div>
      <div style="margin-top:16px;display:flex;gap:10px">
        <button class="btn btn-primary" onclick="downloadFile('/${item.filename}', 'silkdream_${id}.${isImg ? 'png' : 'mp4'}')">⬇ Download</button>
        <button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
      </div>
    </div>
  `;

    document.body.appendChild(backdrop);
}

async function deleteItem(id) {
    if (!confirm('Delete this generation?')) return;
    try {
        await fetch(`/api/history/${id}`, { method: 'DELETE' });
        _galleryData = _galleryData.filter(h => h.id !== id);
        document.getElementById(`card-${id}`)?.remove();
        showToast('Deleted', 'success');
        filterGallery();
    } catch { showToast('Delete failed', 'error'); }
}

function reusePrompt(id) {
    const item = _galleryData.find(h => h.id === id);
    if (!item) return;
    if (item.type === 'image') {
        navigateTo('generate');
        setTimeout(() => {
            if (document.getElementById('genPrompt')) document.getElementById('genPrompt').value = item.prompt;
        }, 200);
    } else {
        navigateTo('animate');
        setTimeout(() => {
            if (document.getElementById('animPrompt')) document.getElementById('animPrompt').value = item.prompt;
        }, 200);
    }
}

async function confirmClearAll() {
    if (!confirm('Delete ALL generations? This cannot be undone.')) return;
    for (const item of _galleryData) {
        try { await fetch(`/api/history/${item.id}`, { method: 'DELETE' }); } catch { }
    }
    _galleryData = [];
    filterGallery();
    showToast('Gallery cleared', 'success');
}
