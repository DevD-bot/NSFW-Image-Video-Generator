// ── App Router ──────────────────────────────────────────────────────────────

const pages = { dashboard: renderDashboard, generate: renderGenerate, animate: renderAnimate, longvideo: renderLongVideo, gallery: renderGallery };

let currentPage = 'dashboard';

function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    if (pages[page]) pages[page](main);
}

document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.page));
});

// ── Connection status ────────────────────────────────────────────────────────
async function checkStatus() {
    const badge = document.getElementById('statusBadge');
    const textEl = badge.querySelector('.status-text');
    try {
        const r = await fetch('/api/status');
        const d = await r.json();
        if (d.connected) {
            badge.className = 'status-badge connected';
            textEl.textContent = 'A1111 Connected';
        } else {
            badge.className = 'status-badge disconnected';
            textEl.textContent = 'A1111 Offline';
        }
    } catch {
        badge.className = 'status-badge disconnected';
        textEl.textContent = 'Server Error';
    }
}

// ── Toast notifications ────────────────────────────────────────────────────
function showToast(msg, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── Utility helpers ────────────────────────────────────────────────────────
function downloadFile(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
}

window.updateSidebarGpu = function (sysInfo) {
    const sbName = document.getElementById('sidebarGpuName');
    const sbVram = document.getElementById('sidebarGpuVram');
    if (sbName) sbName.textContent = sysInfo.gpuName;
    if (sbVram) sbVram.textContent = sysInfo.vram;
};

function formatDate(iso) {
    return new Date(iso).toLocaleString();
}

// ── Init ───────────────────────────────────────────────────────────────────
checkStatus();
setInterval(checkStatus, 10000);
navigateTo('dashboard');
