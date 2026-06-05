import { state } from './state.js';
const render        = ()    => window.render();
const showModal     = o     => window.showModal(o);
const closeModal    = ()    => window.closeModal();
const escapeHtml    = s     => window.escapeHtml(s);
const escapeAttr    = s     => window.escapeAttr(s);
const getToken      = ()    => window.getToken();

const MIME_ICON = { "application/pdf": "📄" };
function fileIcon(mime) { return MIME_ICON[mime] || (mime.startsWith("image/") ? "🖼️" : "📎"); }

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fmtUploadDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}

// -------- RENDER --------
function renderDocuments(t) {
  const docs = state._docs?.[t.id] || null; // null = not yet loaded
  const uploading = state._docsUploading?.[t.id] || false;

  return `
    <div class="panel docs-panel">
      <div class="panel-head">
        <h3>🔒 Document Vault</h3>
        <span class="muted text-sm" style="font-weight:400;font-size:12px;">Private — never shared</span>
      </div>
      <p class="hint" style="margin-bottom:12px;">
        Upload boarding passes, hotel confirmations, visa scans, or any trip documents.
        These files are <strong>private to you</strong> and never visible to shared trip viewers.
      </p>

      ${docs === null ? `
        <div id="docs-loading-${escapeAttr(t.id)}" class="muted text-sm" style="padding:12px 0;">
          Loading documents…
        </div>
      ` : `
        <div class="doc-upload-zone" id="doc-dropzone-${escapeAttr(t.id)}"
             ondragover="event.preventDefault();this.classList.add('drag-over')"
             ondragleave="this.classList.remove('drag-over')"
             ondrop="docDropHandler(event,'${escapeAttr(t.id)}')">
          <div class="doc-upload-inner">
            ${uploading
              ? `<div class="doc-upload-progress"><div class="doc-progress-bar" id="doc-progress-bar-${escapeAttr(t.id)}"></div></div><div class="muted text-sm" style="margin-top:6px;" id="doc-upload-status-${escapeAttr(t.id)}">Uploading…</div>`
              : `<input type="file" id="doc-file-input-${escapeAttr(t.id)}" accept="image/*,application/pdf" style="display:none"
                       onchange="docFileSelected(event,'${escapeAttr(t.id)}')" />
                 <button class="btn" onclick="document.getElementById('doc-file-input-${escapeAttr(t.id)}').click()">+ Upload file</button>
                 <span class="muted text-sm" style="margin-left:8px;">or drag & drop · images & PDFs up to 20 MB</span>`
            }
          </div>
        </div>

        ${!docs.length ? `
          <div class="muted text-sm" style="padding:16px 0 8px;">No documents uploaded yet.</div>
        ` : `
          <div class="doc-grid">
            ${docs.map(d => `
              <div class="doc-card">
                <div class="doc-icon">${fileIcon(d.mime_type)}</div>
                <div class="doc-info">
                  <div class="doc-label">${escapeHtml(d.label)}</div>
                  <div class="doc-meta">${fmtSize(d.size_bytes)} · ${fmtUploadDate(d.uploaded_at)}</div>
                </div>
                <div class="doc-actions">
                  <button class="btn sm" onclick="viewDocument('${escapeAttr(d.id)}','${escapeAttr(d.label)}')">View</button>
                  <button class="icon-btn doc-delete-btn" onclick="deleteDocument('${escapeAttr(d.id)}','${escapeAttr(t.id)}')" title="Delete">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `}
    </div>
  `;
}

// -------- LOAD --------
async function loadDocuments(tripId) {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`/api/docs/list?tripId=${encodeURIComponent(tripId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    const docs = await res.json();
    state._docs = state._docs || {};
    state._docs[tripId] = docs;
    render();
  } catch (e) {
    const el = document.getElementById(`docs-loading-${tripId}`);
    if (el) el.textContent = "Failed to load documents.";
  }
}

// -------- UPLOAD --------
function docDropHandler(event, tripId) {
  event.preventDefault();
  document.getElementById(`doc-dropzone-${tripId}`)?.classList.remove('drag-over');
  const file = event.dataTransfer?.files?.[0];
  if (file) uploadDocument(file, tripId);
}

async function docFileSelected(event, tripId) {
  const file = event.target?.files?.[0];
  const input = event.target;
  if (file) await uploadDocument(file, tripId);
  if (input) input.value = "";
}

async function uploadDocument(file, tripId) {
  const token = getToken();
  if (!token) return;

  const ALLOWED = ["image/jpeg","image/png","image/gif","image/webp","image/heic","image/heif","application/pdf"];
  if (!ALLOWED.includes(file.type)) {
    showModal({ title: "Unsupported file", size: "sm", body: "<p>Only images (JPEG, PNG, GIF, WebP, HEIC) and PDFs are allowed.</p>", actions: [{ label: "OK", onClick: closeModal }] });
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showModal({ title: "File too large", size: "sm", body: "<p>Maximum file size is 20 MB.</p>", actions: [{ label: "OK", onClick: closeModal }] });
    return;
  }

  // Ask for a label
  await new Promise((resolve) => {
    showModal({
      title: "Label this document",
      size: "sm",
      body: `<input id="doc-label-input" placeholder="e.g. Boarding pass, Hotel confirmation…"
                    value="${escapeAttr(file.name.replace(/\.[^.]+$/, ''))}"
                    style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:var(--surface-2);" />`,
      actions: [
        { label: "Upload", primary: true, onClick: async () => {
          const label = document.getElementById("doc-label-input")?.value?.trim() || file.name;
          closeModal();
          await doUpload(file, tripId, label);
          resolve();
        }},
        { label: "Cancel", onClick: () => { closeModal(); resolve(); } }
      ]
    });
  });
}

async function doUpload(file, tripId, label) {
  const token = getToken();
  state._docsUploading = state._docsUploading || {};
  state._docsUploading[tripId] = true;
  render();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("tripId", tripId);
  formData.append("label", label);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/docs/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round(e.loaded / e.total * 100);
        const bar = document.getElementById(`doc-progress-bar-${tripId}`);
        const status = document.getElementById(`doc-upload-status-${tripId}`);
        if (bar) bar.style.transform = `scaleX(${pct / 100})`;
        if (status) status.textContent = `Uploading… ${pct}%`;
      }
    };

    xhr.onload = () => {
      state._docsUploading[tripId] = false;
      if (xhr.status === 200) {
        const doc = JSON.parse(xhr.responseText);
        state._docs = state._docs || {};
        state._docs[tripId] = [doc, ...(state._docs[tripId] || [])];
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          showModal({ title: "Upload failed", size: "sm", body: `<p>${escapeHtml(err.error || "Unknown error")}</p>`, actions: [{ label: "OK", onClick: closeModal }] });
        } catch {
          showModal({ title: "Upload failed", size: "sm", body: "<p>An error occurred during upload.</p>", actions: [{ label: "OK", onClick: closeModal }] });
        }
      }
      render();
      resolve();
    };

    xhr.onerror = () => {
      state._docsUploading[tripId] = false;
      render();
      showModal({ title: "Upload failed", size: "sm", body: "<p>Network error during upload.</p>", actions: [{ label: "OK", onClick: closeModal }] });
      resolve();
    };

    xhr.send(formData);
  });
}

// -------- VIEW --------
async function viewDocument(docId, label) {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`/api/docs/file/${encodeURIComponent(docId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { showModal({ title: "Error", size: "sm", body: "<p>Could not open file.</p>", actions: [{ label: "OK", onClick: closeModal }] }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch {
    showModal({ title: "Error", size: "sm", body: "<p>Could not open file.</p>", actions: [{ label: "OK", onClick: closeModal }] });
  }
}

// -------- DELETE --------
function deleteDocument(docId, tripId) {
  showModal({
    title: "Delete document?",
    size: "sm",
    body: "<p>This will permanently delete this file. It cannot be undone.</p>",
    actions: [
      { label: "Delete", primary: true, onClick: async () => {
        closeModal();
        const token = getToken();
        if (!token) return;
        try {
          await fetch(`/api/docs/${encodeURIComponent(docId)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          state._docs = state._docs || {};
          state._docs[tripId] = (state._docs[tripId] || []).filter(d => d.id !== docId);
          render();
        } catch {
          showModal({ title: "Error", size: "sm", body: "<p>Could not delete file.</p>", actions: [{ label: "OK", onClick: closeModal }] });
        }
      }},
      { label: "Cancel", onClick: closeModal }
    ]
  });
}

Object.assign(window, {
  renderDocuments,
  loadDocuments, docDropHandler, docFileSelected,
  viewDocument, deleteDocument,
});
