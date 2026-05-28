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


const ALL_TABS   = ["overview","itinerary","expenses","packing","reservations","notes","photos"];
const TAB_LABELS = { overview:"Overview", itinerary:"Itinerary", expenses:"Expenses",
                     packing:"Packing", reservations:"Reservations", notes:"Notes", photos:"Photos" };

function updateShareReadLink() {
  const input = document.getElementById("share-read-input");
  if (!input) return;
  const base = input.dataset.base;
  const checked = ALL_TABS.filter(t => document.getElementById(`stab-${t}`)?.checked);
  const allSelected = checked.length === ALL_TABS.length;
  input.value = allSelected ? base : `${base}&tabs=${checked.join(",")}`;
  updateShareQR("read");
}

function updateShareQR(mode) {
  const panel = document.getElementById(`share-qr-panel-${mode}`);
  if (!panel || !panel.classList.contains("open")) return;
  const inputId = mode === "read" ? "share-read-input" : "share-edit-input";
  const input = document.getElementById(inputId);
  if (!input) return;
  const url = encodeURIComponent(input.value);
  const img = panel.querySelector("img");
  const dl = panel.querySelector("a");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${url}`;
  if (img) img.src = qrSrc;
  if (dl) dl.href = qrSrc;
}

function toggleShareQR(mode) {
  const panel = document.getElementById(`share-qr-panel-${mode}`);
  if (!panel) return;
  const isOpen = panel.classList.toggle("open");
  if (isOpen) updateShareQR(mode);
}

async function openShareModal(tripId) {
  showModal({
    title: "Share this trip",
    size: "sm",
    body: `<div style="text-align:center;padding:16px 0;color:var(--ink-soft);">Generating links…</div>`,
    actions: [{ label: "Close", onClick: closeModal }],
  });
  try {
    const authHeader = { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" };
    const [readRes, editRes] = await Promise.all([
      fetch("/api/share/create", { method: "POST", headers: authHeader, body: JSON.stringify({ tripId, mode: "read" }) }),
      fetch("/api/share/create", { method: "POST", headers: authHeader, body: JSON.stringify({ tripId, mode: "edit" }) }),
    ]);
    const [readData, editData] = await Promise.all([readRes.json(), editRes.json()]);
    if (!readRes.ok) throw new Error(readData.error || "Failed to create read link");
    if (!editRes.ok) throw new Error(editData.error || "Failed to create edit link");

    const readBase = `${location.origin}/?share=${readData.token}`;
    const editLink = `${location.origin}/?share=${editData.token}`;

    showModal({
      title: "Share this trip",
      size: "sm",
      body: `
        <div class="field">
          <label>View-only link</label>
          <div class="share-tabs-wrap">
            <div class="share-tabs-label">Tabs to include</div>
            <div class="share-tabs">
              ${ALL_TABS.map(t => `
                <label class="share-tab-chip">
                  <input type="checkbox" id="stab-${t}" value="${t}" checked onchange="updateShareReadLink()"
                         />
                  ${TAB_LABELS[t]}
                </label>`).join("")}
            </div>
          </div>
          <div class="share-link-row">
            <input id="share-read-input" class="share-link-input" value="${readBase}" data-base="${readBase}" readonly />
            <button class="btn sm primary" onclick="copyShareLinkById('share-read-input','share-read-msg')">Copy</button>
            <button class="btn sm" onclick="toggleShareQR('read')" title="Show QR code">${svgIcon("qr")}</button>
          </div>
          <div id="share-read-msg" style="color:var(--primary);font-size:12px;margin-top:4px;display:none;">Copied!</div>
          <div id="share-qr-panel-read" class="share-qr-panel">
            <img src="" alt="QR Code" width="220" height="220" />
            <div class="qr-hint">Scan to view this trip without signing in</div>
            <a class="btn sm" href="" download="trip-view-qr.png">Download QR</a>
          </div>
          <div class="hint" style="margin-top:6px;">Anyone can view this trip without signing in.</div>
        </div>
        <div class="field" style="margin-top:16px;">
          <label>Editable link</label>
          <div class="share-link-row">
            <input id="share-edit-input" class="share-link-input" value="${editLink}" readonly />
            <button class="btn sm primary" onclick="copyShareLinkById('share-edit-input','share-edit-msg')">Copy</button>
            <button class="btn sm" onclick="toggleShareQR('edit')" title="Show QR code">${svgIcon("qr")}</button>
          </div>
          <div id="share-edit-msg" style="color:var(--primary);font-size:12px;margin-top:4px;display:none;">Copied!</div>
          <div id="share-qr-panel-edit" class="share-qr-panel">
            <img src="" alt="QR Code" width="220" height="220" />
            <div class="qr-hint">Scan to open this trip in edit mode</div>
            <a class="btn sm" href="" download="trip-edit-qr.png">Download QR</a>
          </div>
          <div class="hint" style="margin-top:6px;color:#c0392b;">
            ⚠ Anyone with this link can edit this trip. They cannot delete it or access other trips.
          </div>
        </div>
      `,
      actions: [{ label: "Done", primary: true, onClick: closeModal }],
    });
  } catch (err) {
    showModal({
      title: "Share this trip",
      size: "sm",
      body: `<div style="color:#c0392b;padding:12px 0;">${err.message}</div>`,
      actions: [{ label: "Close", onClick: closeModal }],
    });
  }
}
function copyShareLinkById(inputId, msgId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const msg = document.getElementById(msgId);
    if (msg) { msg.style.display = ""; setTimeout(() => msg.style.display = "none", 2000); }
  }).catch(() => { input.select(); document.execCommand("copy"); });
}

// -------- HIGHLIGHT CARD --------
function openHighlightCardModal(tripId) {
  const t = state.trips.find(x => x.id === tripId); if (!t) return;
  const canvas = generateTripCard(t);
  showModal({
    title: "Trip Card",
    size: "lg",
    body: `<div class="highlight-card-preview"><img id="hc-preview" src="${canvas.toDataURL("image/png")}" style="width:100%;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);" /></div>
      <p class="hint" style="text-align:center;">Download and share anywhere — Instagram, group chat, email.</p>`,
    actions: [
      { label: "Close", onClick: closeModal },
      { label: "Download PNG", primary: true, onClick: () => downloadTripCard(canvas, t.title) },
    ],
  });
}

function generateTripCard(t) {
  const W = 1200, H = 630, PAD = 56;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  function drawCard() {
    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#fdf6ee"); bg.addColorStop(1, "#fff0dc");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Left image panel — rounded rect, inset with padding
    const imgX = PAD, imgY = PAD, imgW = Math.round(W * 0.44) - PAD, imgH = H - PAD * 2, r = 24;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(imgX + r, imgY);
    ctx.lineTo(imgX + imgW - r, imgY); ctx.arcTo(imgX + imgW, imgY, imgX + imgW, imgY + r, r);
    ctx.lineTo(imgX + imgW, imgY + imgH - r); ctx.arcTo(imgX + imgW, imgY + imgH, imgX + imgW - r, imgY + imgH, r);
    ctx.lineTo(imgX + r, imgY + imgH); ctx.arcTo(imgX, imgY + imgH, imgX, imgY + imgH - r, r);
    ctx.lineTo(imgX, imgY + r); ctx.arcTo(imgX, imgY, imgX + r, imgY, r);
    ctx.closePath(); ctx.clip();

    const pg = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
    pg.addColorStop(0, "#e07b39"); pg.addColorStop(1, "#f5a55a");
    ctx.fillStyle = pg; ctx.fillRect(imgX, imgY, imgW, imgH);

    if (canvas._thumbImg) {
      const img = canvas._thumbImg;
      const scale = Math.max(imgW / img.width, imgH / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, imgX + (imgW - dw) / 2, imgY + (imgH - dh) / 2, dw, dh);
    } else {
      ctx.font = `${Math.round(imgH * 0.38)}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.emoji || "✈️", imgX + imgW / 2, imgY + imgH / 2);
    }
    ctx.restore();

    // Right panel
    const tx = imgX + imgW + PAD + 8, tw = W - tx - PAD;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    let cy = 140;

    ctx.fillStyle = "#1a1a1a";
    ctx.font = `bold 68px ${FONT}`;
    let title = t.title || "My Trip";
    while (ctx.measureText(title).width > tw && title.length > 2) title = title.slice(0, -1);
    if (title !== t.title) title = title.trimEnd() + "…";
    ctx.fillText(title, tx, cy); cy += 78;

    if (t.destination) {
      ctx.fillStyle = "#e07b39";
      ctx.font = `bold 36px ${FONT}`;
      let dest = t.destination;
      while (ctx.measureText(dest).width > tw && dest.length > 2) dest = dest.slice(0, -1);
      if (dest !== t.destination) dest = dest.trimEnd() + "…";
      ctx.fillText(dest, tx, cy); cy += 52;
    }

    if (t.startDate) {
      ctx.fillStyle = "#666";
      ctx.font = `500 30px ${FONT}`;
      const ds = fmtDate(t.startDate, { month: "short", day: "numeric", year: "numeric" }) +
        (t.endDate ? " – " + fmtDate(t.endDate, { month: "short", day: "numeric", year: "numeric" }) : "");
      ctx.fillText(ds, tx, cy); cy += 48;
    }

    cy += 16;
    ctx.strokeStyle = "#e5d5c5"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx, cy); ctx.lineTo(W - PAD, cy); ctx.stroke(); cy += 36;

    const statParts = [];
    if ((t.travelers || []).length) statParts.push(`👥 ${t.travelers.length} traveler${t.travelers.length === 1 ? "" : "s"}`);
    const spend = (t.expenses || []).reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
    if (spend > 0) statParts.push(`💰 ${fmtCurrency(spend)}`);
    const dur = tripDuration(t);
    if (dur) statParts.push(`📅 ${dur} day${dur === 1 ? "" : "s"}`);
    if (statParts.length) {
      ctx.fillStyle = "#555"; ctx.font = `500 28px ${FONT}`;
      ctx.fillText(statParts.join("   ·   "), tx, cy);
    }

    ctx.fillStyle = "#bba898"; ctx.font = `400 22px ${FONT}`;
    ctx.fillText("wanderwise ~ trip planner", tx, H - PAD + 14);
  }

  drawCard();

  if (t.driveFolder?.thumbnailId) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { canvas._thumbImg = img; drawCard(); const p = document.getElementById("hc-preview"); if (p) p.src = canvas.toDataURL("image/png"); };
    img.onerror = () => { /* proxy failed, draw without photo */ drawCard(); };
    img.src = `/api/drive/thumb?fileId=${encodeURIComponent(t.driveFolder.thumbnailId)}&sz=600`;
  }

  return canvas;
}

function downloadTripCard(canvas, title) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${(title || "trip").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-card.png`;
  a.click();
}

Object.assign(window, {
  updateShareReadLink, updateShareQR, toggleShareQR, openShareModal, copyShareLinkById,
  openHighlightCardModal, generateTripCard, downloadTripCard,
});

