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


const THEMES = [
  { id: "beach",    label: "Beach",       emoji: "🏖️", p1:"#009eb0", p2:"#ff7e6b", bg:"linear-gradient(135deg,#b7e7f0,#ffe9c4,#ffc1b0)" },
  { id: "forest",   label: "Forest",      emoji: "🌲", p1:"#2e7d4f", p2:"#c97b3a", bg:"linear-gradient(135deg,#cfeacf,#e9f3d6,#f5e9c8)" },
  { id: "city",     label: "City",        emoji: "🏙️", p1:"#1f5f8b", p2:"#d4a44a", bg:"linear-gradient(135deg,#d6e1ec,#eef1f4,#f5e8d4)" },
  { id: "sunset",   label: "Sunset",      emoji: "🌅", p1:"#d94a6e", p2:"#f4a261", bg:"linear-gradient(135deg,#ffd5b8,#ffb3c1,#d4a8e0)" },
  { id: "aurora",   label: "Aurora",      emoji: "🌌", p1:"#5b4b9c", p2:"#2bb3a3", bg:"linear-gradient(135deg,#b8c8e8,#c8b8e8,#a8d8d0)" },
  { id: "mono",     label: "Mono",        emoji: "✈️", p1:"#2b2b2b", p2:"#777777", bg:"linear-gradient(135deg,#ececec,#f6f6f6,#e2e2e2)" },
  { id: "sakura",   label: "Sakura",      emoji: "🌸", p1:"#c2185b", p2:"#c9a227", bg:"linear-gradient(135deg,#fce4ec,#fdf0f5,#fef9e7)" },
  { id: "desert",   label: "Desert",      emoji: "🏜️", p1:"#c1440e", p2:"#d4a843", bg:"linear-gradient(135deg,#f5deb3,#f0c9a0,#e8b88a)" },
  { id: "arctic",   label: "Arctic",      emoji: "🏔️", p1:"#0277bd", p2:"#8e6bbf", bg:"linear-gradient(135deg,#e8f4fd,#f0eafa,#e4f2f8)" },
  { id: "tropics",  label: "Tropics",     emoji: "🌴", p1:"#00796b", p2:"#ff6f00", bg:"linear-gradient(135deg,#b2dfdb,#dcedc8,#fff9c4)" },
  { id: "midnight", label: "Midnight",    emoji: "🌃", p1:"#7c5cbf", p2:"#e040fb", bg:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  { id: "golden",   label: "Golden Hour", emoji: "🌄", p1:"#b35a00", p2:"#c0392b", bg:"linear-gradient(135deg,#ffe8c0,#ffd49e,#ffbc7a)" }
];

// -------- SETTINGS / EXPORT-IMPORT --------
function openSettings() {
  const stats = {
    trips: state.trips.length,
    expenses: state.trips.reduce((s,t)=>s + (t.expenses||[]).length, 0),
    items: state.trips.reduce((s,t)=>s + (t.packing||[]).reduce((a,c)=>a+c.items.length,0), 0)
  };
  showModal({
    title: "Settings",
    body: `
      <div class="set-panel">
        <div class="field">
          <label>Color theme</label>
          <div class="theme-grid">
            ${THEMES.map(th => `
              <div class="theme-swatch ${state.settings.theme===th.id?'sel':''}" onclick="pickTheme('${th.id}')"
                   style="--p1:${th.p1};--p2:${th.p2};">
                <div class="preview" style="background:${th.bg};">
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">${th.emoji}</div>
                  <div style="position:absolute;bottom:6px;right:6px;width:18px;height:18px;border-radius:50%;background:${th.p2};border:2px solid white;"></div>
                </div>
                <div class="name">${th.label}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="field">
          <label>Currency</label>
          <select onchange="updateCurrency(this.value)">
            ${["USD","EUR","GBP","JPY","CAD","AUD","CHF","CNY","INR","MXN","BRL","KRW","SGD","VND","THB"].map(c => `<option ${state.settings.currency===c?"selected":""}>${c}</option>`).join("")}
          </select>
        </div>

        ${isLoggedIn() ? `
        <div class="field">
          <label>Data</label>
          <div class="row">
            <button class="btn" onclick="exportJson()">⬇ Export all to JSON</button>
            <label class="btn">
              ⬆ Import JSON
              <input type="file" accept=".json" style="display:none;" onchange="importJson(event)"/>
            </label>
          </div>
          <div class="hint" style="margin-top:8px;">
            ${stats.trips} trip${stats.trips===1?"":"s"} · ${stats.expenses} expense${stats.expenses===1?"":"s"} · ${stats.items} packing item${stats.items===1?"":"s"} synced to cloud.<br>
            Export a JSON backup any time. Import merges by trip ID — existing backups still work.
          </div>
        </div>

        <div class="field">
          <label style="color:#c0392b;">Danger zone</label>
          <button class="btn danger" onclick="resetAll()">Reset all data</button>
        </div>
        ` : ""}

        <div class="field">
          <label>App</label>
          <button class="btn" onclick="hardRefresh()">🔄 Hard refresh &amp; empty cache</button>
          <div class="hint" style="margin-top:8px;">Clears the service worker cache and reloads. Use if the app feels stuck on an old version.</div>
        </div>
      </div>
    `,
    actions: [{ label: "Done", primary: true, onClick: closeModal }]
  });
}
async function hardRefresh() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  location.reload(true);
}
function pickTheme(id) {
  setTheme(id);
  document.querySelectorAll(".theme-swatch").forEach(s => s.classList.remove("sel"));
  document.querySelectorAll(`.theme-swatch[onclick*="${id}"]`).forEach(s => s.classList.add("sel"));
}
function updateCurrency(c) { if (!guardEdit()) return; state.settings.currency = c; saveState(); render(); }
function exportJson() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `trip-planner-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
}
function importJson(ev) {
  const file = ev.target.files[0]; if (!file) return;
  ev.target.value = ""; // allow re-importing the same file
  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try { data = JSON.parse(e.target.result); } catch {
      showModal({ title: "Import failed", size: "sm",
        body: `<p style="color:var(--red,#e53);margin:0;">The selected file is not valid JSON.</p>`,
        actions: [{ label: "OK", primary: true, onClick: closeModal }] });
      return;
    }
    if (!Array.isArray(data.trips)) {
      showModal({ title: "Import failed", size: "sm",
        body: `<p style="color:var(--red,#e53);margin:0;">This doesn't look like a TripPlanner backup — <code>trips</code> array not found.</p>`,
        actions: [{ label: "OK", primary: true, onClick: closeModal }] });
      return;
    }
    const valid = data.trips.filter(t => t && t.id && t.title);
    const invalid = data.trips.length - valid.length;
    const existing = new Set(state.trips.map(t => t.id));
    const newTrips = valid.filter(t => !existing.has(t.id));
    const skipped = valid.length - newTrips.length;
    const lines = [
      `<strong>${newTrips.length}</strong> trip${newTrips.length !== 1 ? "s" : ""} will be added`,
      skipped ? `<strong>${skipped}</strong> already exist and will be skipped` : "",
      invalid ? `<strong>${invalid}</strong> item${invalid !== 1 ? "s" : ""} skipped (missing id or title)` : "",
    ].filter(Boolean).map(l => `<li>${l}</li>`).join("");
    const meta = data.version
      ? `<p style="font-size:12px;color:var(--ink-soft);margin:10px 0 0;">Backup v${data.version} · Exported ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : "unknown date"}</p>`
      : "";
    showModal({
      title: "Import trips",
      size: "sm",
      body: `<ul style="margin:0;padding:0 0 0 18px;line-height:1.9;">${lines}</ul>${meta}`,
      actions: [
        { label: `Add ${newTrips.length} trip${newTrips.length !== 1 ? "s" : ""}`, primary: true, onClick: () => {
          newTrips.forEach(t => state.trips.push(t));
          if (data.settings) state.settings = Object.assign(state.settings, data.settings);
          saveState(); closeModal(); render();
        }},
        { label: "Cancel", onClick: closeModal },
      ],
    });
  };
  reader.readAsText(file);
}
function resetAll() {
  if (!isLoggedIn()) return;
  if (!confirm("Delete ALL trips and data? This cannot be undone.")) return;
  if (!confirm("Really? Last chance.")) return;
  setState(DEFAULT_STATE());
  saveState(); closeModal(); goHome();
}

Object.assign(window, {
  openSettings, hardRefresh, pickTheme, updateCurrency, exportJson, importJson, resetAll,
});

