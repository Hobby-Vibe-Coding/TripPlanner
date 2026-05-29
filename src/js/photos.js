import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
// Bridges – resolved at call-time via window (no circular imports needed)
const render        = ()    => window.render();
const saveState     = ()    => window.saveState();
const showModal     = o     => window.showModal(o);
const closeModal    = ()    => window.closeModal();
const guardEdit     = ()    => window.guardEdit();
const currentTrip   = ()    => window.currentTrip();
const escapeHtml    = s     => window.escapeHtml(s);
const fmtCurrency   = n     => window.fmtCurrency(n);
const escapeAttr    = s     => window.escapeAttr(s);
const uid           = ()    => window.uid();
const parseDate     = d     => window.parseDate(d);
const fmtDate       = (d,o) => window.fmtDate(d,o);
const daysBetween   = (a,b) => window.daysBetween(a,b);
const daysUntil     = d     => window.daysUntil(d);
const fmtBookingTime = v    => window.fmtBookingTime(v);
const tripDuration  = t     => window.tripDuration(t);
const showLoginModal = t    => window.showLoginModal(t);
const svgIcon        = n    => window.svgIcon(n);


// Photos-local state
const driveCache          = new Map();
const DRIVE_CACHE_TTL     = 5 * 60 * 1000;
let lightboxFiles         = [];
let lightboxIdx           = 0;
const lightboxFullResReady = new Set();

// -------- PHOTOS TAB --------
function renderPhotos(t) {
  const fd = t.driveFolder || {};
  const folderId = fd.folderId || null;
  const thumbnailId = fd.thumbnailId || null;
  const shareReadOnly = document.documentElement.getAttribute("data-share") === "read";
  const cached = folderId ? driveCache.get(folderId) : null;
  const isStale = !cached || (Date.now() - cached.fetchedAt > DRIVE_CACHE_TTL);
  if (folderId && isStale && !cached?.loading) fetchDrivePhotos(folderId);

  const folderRow = folderId
    ? `<div class="drive-link-row">
        <span class="drive-folder-label" title="${escapeHtml(folderId)}">📁 Google Drive folder linked</span>
        ${!shareReadOnly ? `
          <button class="btn sm" onclick="refreshDrivePhotos('${escapeAttr(folderId)}')">Refresh</button>
          <button class="btn sm ghost" style="color:#c0392b;" onclick="unlinkDriveFolder()">Unlink</button>` : ""}
      </div>`
    : (!shareReadOnly ? `<div style="margin-bottom:16px;">
        <button class="btn primary" onclick="openLinkDriveModal()">${svgIcon("camera")} Link Google Drive Folder</button>
        <p class="hint" style="margin-top:8px;">Paste a Google Drive folder URL. The folder must be set to "Anyone with the link can view."</p>
      </div>` : "");

  let gridHtml = "";
  if (!folderId) {
    gridHtml = `<div class="empty-mini">No Drive folder linked yet.</div>`;
  } else if (!cached || cached.loading) {
    gridHtml = `<div class="empty-mini">Loading photos…</div>`;
  } else if (cached.error) {
    gridHtml = `<div class="empty-mini" style="color:#c0392b;">${escapeHtml(cached.error)}</div>`;
  } else if (!cached.files.length) {
    gridHtml = `<div class="empty-mini">No images found in this folder.</div>`;
  } else {
    const thumbs = cached.files.map((f, i) => {
      const isThumb = f.id === thumbnailId;
      const thumbSrc = getFileThumbUrl(f, 400);
      return `<div class="photo-thumb${isThumb ? " is-cover" : ""}" onclick="openLightbox(${i})">
        <img data-src="${escapeAttr(thumbSrc)}" src="" alt="${escapeHtml(f.name)}" loading="lazy" decoding="async" />
        ${isThumb ? `<div class="photo-thumb-cover-badge">★ Cover</div>` : ""}
        <div class="photo-thumb-overlay">
          ${!shareReadOnly ? `<button class="photo-thumb-star${isThumb ? " is-thumb" : ""}" onclick="setTripThumbnail(event,'${escapeAttr(f.id)}')" title="${isThumb ? "Set another photo as cover" : "Set as trip cover"}">★</button>` : ""}
          <span class="photo-thumb-name">${escapeHtml(f.name)}</span>
        </div>
      </div>`;
    }).join("");
    gridHtml = `<div class="photo-grid">${thumbs}</div>`;
  }

  return `<div class="panel">
    <div class="panel-head">
      <h3>Photos</h3>
      ${cached?.files?.length ? `<span style="font-size:13px;color:var(--ink-soft);">${cached.files.length} photo${cached.files.length === 1 ? "" : "s"}</span>` : ""}
    </div>
    ${folderRow}
    ${gridHtml}
  </div>`;
}

async function fetchDrivePhotos(folderId, forceRefresh = false) {
  if (!folderId) return;
  const cached = driveCache.get(folderId);
  if (cached?.loading) return; // already in flight
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < DRIVE_CACHE_TTL) return;
  // Set loading flag synchronously before any await to prevent duplicate calls
  driveCache.set(folderId, { files: cached?.files || [], fetchedAt: cached?.fetchedAt || 0, loading: true });
  if (route.view === "trip" && route.tab === "photos") render();
  try {
    const res = await fetch(`/api/drive/folder?folderId=${encodeURIComponent(folderId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load photos");
    driveCache.set(folderId, { files: data.files || [], fetchedAt: Date.now() });
    lightboxFiles = data.files || [];
  } catch (e) {
    driveCache.set(folderId, { files: [], fetchedAt: Date.now(), error: e.message });
  }
  if (route.view === "trip" && route.tab === "photos") render();
}

let photoLazyObserver = null;
function setupPhotoLazyLoad() {
  if (photoLazyObserver) { photoLazyObserver.disconnect(); photoLazyObserver = null; }
  const imgs = document.querySelectorAll('.photo-thumb img[data-src]');
  if (!imgs.length) return;
  if (!('IntersectionObserver' in window)) {
    imgs.forEach(img => { if (img.dataset.src) img.src = img.dataset.src; });
    return;
  }
  photoLazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.dataset.src) {
        e.target.src = e.target.dataset.src;
        photoLazyObserver.unobserve(e.target);
      }
    });
  }, { rootMargin: '400px' });
  imgs.forEach(img => photoLazyObserver.observe(img));
}

function refreshDrivePhotos(folderId) {
  driveCache.delete(folderId);
  render();
}

function openLinkDriveModal() {
  if (!guardEdit()) return;
  showModal({
    title: "Link Google Drive Folder",
    size: "sm",
    body: `<div class="field">
      <label>Folder URL or ID</label>
      <input id="drive-folder-input" placeholder="https://drive.google.com/drive/folders/…" autofocus style="width:100%;" />
      <div class="hint">Set the folder to "Anyone with the link can view" in Google Drive first.</div>
    </div>
    <div id="drive-link-error" style="color:#c0392b;font-size:13px;display:none;margin-top:8px;"></div>`,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Link Folder", primary: true, onClick: submitLinkDriveFolder },
    ],
  });
}

function submitLinkDriveFolder() {
  const input = document.getElementById("drive-folder-input");
  const errEl = document.getElementById("drive-link-error");
  const raw = (input?.value || "").trim();
  const match = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/) || raw.match(/^([a-zA-Z0-9_-]{10,})$/);
  if (!match) {
    if (errEl) { errEl.textContent = "Could not find a folder ID. Paste the full Drive folder URL."; errEl.style.display = ""; }
    return;
  }
  const folderId = match[1];
  const t = currentTrip(); if (!t) return;
  if (!t.driveFolder) t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
  t.driveFolder.folderId = folderId;
  saveState(); closeModal(); render();
  fetchDrivePhotos(folderId, true);
}

function unlinkDriveFolder() {
  if (!guardEdit()) return;
  if (!confirm("Remove the linked Drive folder? Photos will no longer show.")) return;
  const t = currentTrip(); if (!t) return;
  t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
  saveState(); render();
}

function setTripThumbnail(event, fileId) {
  if (event) event.stopPropagation();
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (!t.driveFolder) t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
  t.driveFolder.thumbnailId = fileId;
  saveState(); render();
  if (document.getElementById("modal-root")?.querySelector(".lightbox-bg")) renderLightbox();
}

function openLightbox(idx) {
  const t = currentTrip();
  const cached = t?.driveFolder?.folderId ? driveCache.get(t.driveFolder.folderId) : null;
  lightboxFiles = cached?.files || [];
  if (!lightboxFiles.length) return;
  lightboxIdx = idx;
  renderLightbox();
}

function renderLightbox() {
  if (!lightboxFiles.length) return;
  const f = lightboxFiles[lightboxIdx];
  const total = lightboxFiles.length;
  const t = currentTrip();
  const isThumb = t?.driveFolder?.thumbnailId === f.id;
  const shareReadOnly = document.documentElement.getAttribute("data-share") === "read";
  // Use thumbnailLink directly when available (Google CDN, no proxy hop); fall back to proxy
  const thumbSrc = getFileThumbUrl(f, 400);
  const fullSrc  = getFileThumbUrl(f, 1200);
  const root = document.getElementById("modal-root");
  root.innerHTML = `<div class="lightbox-bg" onclick="if(event.target===this)closeLightbox()" id="lightbox-bg">
    <div class="lightbox-img-wrap">
      <img id="lightbox-img" src="${escapeAttr(thumbSrc)}" alt="${escapeHtml(f.name)}" />
    </div>
    <button class="lightbox-close" onclick="closeLightbox()" title="Close (Esc)">✕</button>
    ${total > 1 ? `<button class="lightbox-nav prev" onclick="moveLightbox(-1)">&#8249;</button>
    <button class="lightbox-nav next" onclick="moveLightbox(1)">&#8250;</button>` : ""}
    <div class="lightbox-counter">${lightboxIdx + 1} / ${total}</div>
    ${!shareReadOnly ? `<button class="lightbox-cover-btn${isThumb ? " is-thumb" : ""}" onclick="setTripThumbnail(event,'${escapeAttr(f.id)}')">${isThumb ? "★ Trip Cover" : "☆ Set as Cover"}</button>` : ""}
  </div>`;
  // If full-res already loaded this session, swap src immediately (browser HTTP cache = no network)
  if (lightboxFullResReady.has(f.id)) {
    const el = document.getElementById("lightbox-img");
    if (el) el.src = fullSrc;
  } else {
    const hi = new Image();
    hi.onload = () => {
      lightboxFullResReady.add(f.id);
      const el = document.getElementById("lightbox-img");
      if (el) el.src = fullSrc;
    };
    hi.src = fullSrc;
  }
  // Preload adjacent images so navigation is instant
  if (lightboxFiles.length > 1) {
    [-1, 1, 2].forEach(offset => {
      const nf = lightboxFiles[(lightboxIdx + offset + lightboxFiles.length) % lightboxFiles.length];
      if (nf && nf !== f && !lightboxFullResReady.has(nf.id)) {
        const pre = new Image();
        pre.onload = () => lightboxFullResReady.add(nf.id);
        pre.src = getFileThumbUrl(nf, 1200);
      }
    });
  }
}

function moveLightbox(dir) {
  if (!lightboxFiles.length) return;
  lightboxIdx = (lightboxIdx + dir + lightboxFiles.length) % lightboxFiles.length;
  renderLightbox();
}

function closeLightbox() {
  document.getElementById("modal-root").innerHTML = "";
}

Object.assign(window, {
  renderPhotos, setupPhotoLazyLoad, refreshDrivePhotos, openLinkDriveModal, unlinkDriveFolder,
  setTripThumbnail, openLightbox, renderLightbox, moveLightbox, closeLightbox,
});

