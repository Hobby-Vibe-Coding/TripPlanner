import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
// Bridges – resolved at call-time via window (no circular imports needed)
const render        = ()    => window.render();
const mutate        = p     => window.mutate(p);
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
const getToken       = ()   => window.getToken();


// Photos-local state
const driveCache          = new Map();
const DRIVE_CACHE_TTL     = 5 * 60 * 1000;
let lightboxFiles         = [];
let lightboxIdx           = 0;
const lightboxFullResReady = new Set();
const photoUploadState    = new Map(); // tripId -> { done, total }
const PHOTO_ALLOWED_MIME  = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];

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
        <a class="drive-folder-label" href="${escapeAttr(`https://drive.google.com/drive/folders/${folderId}`)}" target="_blank" rel="noopener noreferrer" title="Open in Google Drive">📁 Google Drive folder linked</a>
        ${!shareReadOnly ? `
          <button class="btn sm" onclick="refreshDrivePhotos('${escapeAttr(folderId)}')">Refresh</button>
          <button class="btn sm ghost" style="color:#c0392b;" onclick="unlinkDriveFolder()">Unlink</button>` : ""}
      </div>`
    : (!shareReadOnly ? `<div style="margin-bottom:16px;">
        <button class="btn primary" onclick="openLinkDriveModal()">${svgIcon("camera")} Link Google Drive Folder</button>
        <p class="hint" style="margin-top:8px;">Paste a Google Drive folder URL. The folder must be set to "Anyone with the link can view."</p>
      </div>` : "");

  const uploadState = photoUploadState.get(t.id);
  const uploadZone = (folderId && !shareReadOnly)
    ? `<div class="doc-upload-zone" id="photo-dropzone-${escapeAttr(t.id)}"
          ondragover="event.preventDefault();this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="photoDropHandler(event,'${escapeAttr(t.id)}','${escapeAttr(folderId)}')">
        <div class="doc-upload-inner">
          ${uploadState
            ? `<div class="doc-upload-progress"><div class="doc-progress-bar" style="transform:scaleX(${uploadState.total ? uploadState.done / uploadState.total : 0})"></div></div>
               <div class="muted text-sm" style="margin-top:6px;">Uploading ${uploadState.done}/${uploadState.total}…</div>`
            : `<input type="file" id="photo-file-input-${escapeAttr(t.id)}" accept="image/*" multiple style="display:none"
                     onchange="photoFilesSelected(event,'${escapeAttr(t.id)}','${escapeAttr(folderId)}')" />
               <button class="btn" onclick="document.getElementById('photo-file-input-${escapeAttr(t.id)}').click()">${svgIcon("camera")} Add Photos</button>
               <span class="muted text-sm" style="margin-left:8px;">or drag &amp; drop · uploads straight to the linked Drive folder</span>`
          }
        </div>
      </div>`
    : "";

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
    ${uploadZone}
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

// -------- UPLOAD --------
function photoDropHandler(event, tripId, folderId) {
  event.preventDefault();
  document.getElementById(`photo-dropzone-${tripId}`)?.classList.remove('drag-over');
  if (!guardEdit()) return;
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length) uploadPhotos(files, tripId, folderId);
}

function photoFilesSelected(event, tripId, folderId) {
  const files = Array.from(event.target?.files || []);
  const input = event.target;
  if (guardEdit() && files.length) uploadPhotos(files, tripId, folderId);
  if (input) input.value = "";
}

async function uploadPhotos(files, tripId, folderId) {
  const errors = [];
  const toUpload = [];
  for (const f of files) {
    if (!PHOTO_ALLOWED_MIME.includes(f.type)) { errors.push(`${f.name}: unsupported file type`); continue; }
    if (f.size > 20 * 1024 * 1024) { errors.push(`${f.name}: too large (max 20 MB)`); continue; }
    toUpload.push(f);
  }
  if (!toUpload.length) {
    showModal({ title: "Couldn't upload", size: "sm", body: `<p>${errors.map(escapeHtml).join('<br>') || "No valid images selected."}</p>`, actions: [{ label: "OK", onClick: closeModal }] });
    return;
  }

  photoUploadState.set(tripId, { done: 0, total: toUpload.length });
  render();

  for (const file of toUpload) {
    try { await uploadSinglePhoto(file, folderId); }
    catch (e) { errors.push(`${file.name}: ${e.message}`); }
    const st = photoUploadState.get(tripId);
    if (st) { st.done += 1; render(); }
  }
  photoUploadState.delete(tripId);

  driveCache.delete(folderId);
  await fetchDrivePhotos(folderId, true);

  if (errors.length) {
    showModal({ title: "Some photos didn't upload", size: "sm", body: `<p>${errors.map(escapeHtml).join('<br>')}</p>`, actions: [{ label: "OK", onClick: closeModal }] });
  }
}

async function uploadSinglePhoto(file, folderId) {
  const shareMode = document.documentElement.hasAttribute("data-share");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderId", folderId);
  const headers = {};
  if (shareMode && window._shareToken) {
    formData.append("shareToken", window._shareToken);
  } else {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  const res = await fetch("/api/drive/upload", { method: "POST", headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
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
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { driveFolderId: folderId } });
  closeModal(); render();
  fetchDrivePhotos(folderId, true);
}

function unlinkDriveFolder() {
  if (!guardEdit()) return;
  if (!confirm("Remove the linked Drive folder? Photos will no longer show.")) return;
  const t = currentTrip(); if (!t) return;
  t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { driveFolderId: null, driveThumbnailId: null, driveThumbnailUrl: null } });
  render();
}

function setTripThumbnail(event, fileId) {
  if (event) event.stopPropagation();
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (!t.driveFolder) t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
  t.driveFolder.thumbnailId = fileId;
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { driveThumbnailId: fileId } });
  render();
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
  photoDropHandler, photoFilesSelected,
});

