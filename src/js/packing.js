import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
// Bridges – resolved at call-time via window (no circular imports needed)
const render        = ()    => window.render();
const tripPanelRender = () => window.tripPanelRender();
const updateTripHeaderStats = () => window.updateTripHeaderStats();
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
const renderAssigneeChips = (names, tr, cb) => window.renderAssigneeChips(names, tr, cb);
const openAssigneePickerModal = (opts) => window.openAssigneePickerModal(opts);


// Packing-local state
let ntDestAcResults = [];
let ntDestAcIdx     = -1;
let ntDestCoords    = null;
const weatherCache     = new Map();
const WEATHER_CACHE_TTL = 60 * 60 * 1000;
let destAcTimer = null;
let destAcIdx   = -1;
let destAcResults = [];

// -------- PREPARATION TAB --------
const PREP_LISTS = [
  { key: "packing",  label: "Packing List",  emptyIcon: " 🧳", hint: "Things to physically bring on the trip." },
  { key: "shopping", label: "Shopping List",  emptyIcon: " 🛒", hint: "Things to buy before the trip. Check off a whole category, then move it into the Packing List." },
  { key: "todo",     label: "To-Do List",     emptyIcon: " ✅", hint: "Things to do before the trip — not stuff to bring." },
];
let prepSubTab = "packing";

function setPrepSubTab(key) {
  prepSubTab = key;
  tripPanelRender();
}

function renderPrepPanel(t) {
  const active = PREP_LISTS.find(l => l.key === prepSubTab) || PREP_LISTS[0];
  return `
    <div class="prep-subtabs no-print">
      ${PREP_LISTS.map(l => `<button class="prep-subtab ${l.key === active.key ? "active" : ""}" onclick="setPrepSubTab('${l.key}')">${escapeHtml(l.label)}</button>`).join("")}
    </div>
    <p class="prep-hint">${escapeHtml(active.hint)}</p>
    ${renderPackList(t, active.key)}
  `;
}

function renderPackList(t, listType) {
  const entries = (t.packing || [])
    .map((c, ci) => ({ c, ci }))
    .filter(({ c }) => (c.listType || "packing") === listType);
  const meta = PREP_LISTS.find(l => l.key === listType) || PREP_LISTS[0];

  if (entries.length === 0) {
    return `
      <div class="panel">
        <div class="panel-head"><h3>${escapeHtml(meta.label)}</h3></div>
        <div class="empty-mini">
          <h4>Nothing here yet${meta.emptyIcon}</h4>
          <p>${listType === "packing" ? "Start from a template or build from scratch." : "Add a category to get started."}</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px;">
            ${listType === "packing" ? `<button class="btn primary sm" onclick="loadPackingTemplate()">+ Load template</button>` : ""}
            <button class="btn sm" onclick="addPackCategory('${listType}')">+ Empty category</button>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="panel">
      <div class="panel-head">
        <h3>${escapeHtml(meta.label)}</h3>
        <div class="actions" style="display:flex;align-items:center;gap:10px;">
          <button class="btn sm" onclick="addPackCategory('${listType}')">+ Add category</button>
        </div>
      </div>
      <div class="pack-grid">
        ${entries.map(({ c, ci }) => {
          const total = c.items.length, done = c.items.filter(i=>i.packed).length;
          const canMove = listType === "shopping" && total > 0 && done === total;
          return `
            <div class="pack-cat" data-ci="${ci}">
              <div class="pack-cat-head">
                <div class="pack-cat-title">
                  <input value="${escapeHtml(c.name)}" onchange="updatePackCat(${ci}, this.value)" />
                </div>
                <span class="pack-cat-progress">${done}/${total}</span>
                <button class="icon-btn no-print" style="width:28px;height:28px;" title="Delete category" onclick="deletePackCat(${ci})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="pack-bar"><div class="pack-bar-fill" style="--pct:${total ? (done/total) : 0}"></div></div>
              <div class="pack-items">
                ${c.items.map((it, ii) => `
                  <div class="pack-item ${it.packed?"checked":""}" data-ii="${ii}">
                    <div class="pack-item-name-row">
                      <input type="checkbox" ${it.packed?"checked":""} onchange="togglePack(${ci},${ii})" />
                      <input type="text" class="pack-item-name" title="${escapeAttr(it.name)}" value="${escapeHtml(it.name)}" onchange="updatePackItem(${ci},${ii},this.value)" />
                    </div>
                    ${renderAssigneeChips(it.assignedTo, t, `openPackItemAssigneeModal(${ci},${ii})`)}
                    <button class="x" onclick="deletePackItem(${ci},${ii})" title="Remove">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                `).join("")}
              </div>
              ${canMove ? `<button class="btn sm primary no-print pack-move-btn" style="width:100%;justify-content:center;margin-top:8px;" onclick="movePackCategoryToPacking(${ci})">✓ All bought — Move to Packing List</button>` : ""}
              <div class="pack-add no-print">
                <input placeholder="+ Add item" onkeydown="if(event.key==='Enter'){addPackItem(${ci},this.value);this.value=''}" />
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
function loadPackingTemplate() {
  if (!guardEdit()) return;
  const t = currentTrip();
  const others = (t.packing || []).filter(c => (c.listType || "packing") !== "packing");
  const templateCats = window.PACKING_TEMPLATE.map(c => ({ id: uid(), name: c.name, listType: "packing", items: c.items.map(i => ({ id: uid(), name: i, packed: false })) }));
  t.packing = [...others, ...templateCats];
  mutate({ type: 'syncPackCategories', tripId: t.id, categories: t.packing });
  tripPanelRender();
}
function movePackCategoryToPacking(ci) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const cat = t.packing[ci];
  if (!cat) return;
  const normalizedName = (cat.name || "").trim().toLowerCase();
  const existing = t.packing.find((c, i) => i !== ci && (c.listType || "packing") === "packing" && (c.name || "").trim().toLowerCase() === normalizedName);

  if (existing) {
    if (!confirm(`"${existing.name}" already exists in Packing List. Merge "${cat.name}" into it? Items will be combined and reset to unpacked.`)) return;
    existing.items.push(...cat.items.map(i => ({ ...i, packed: false })));
    t.packing = t.packing.filter((c, i) => i !== ci);
    mutate({ type: 'mergePackCategory', sourceCategoryId: cat.id, targetCategoryId: existing.id });
  } else {
    if (!confirm(`Move "${cat.name}" from Shopping List to Packing List? All its items will be reset to unpacked.`)) return;
    cat.listType = 'packing';
    cat.items.forEach(i => { i.packed = false; });
    mutate({ type: 'movePackCategory', categoryId: cat.id, toListType: 'packing' });
  }
  tripPanelRender();
}

// -------- DESTINATION AUTOCOMPLETE --------
function onDestInput(val) {
  clearTimeout(destAcTimer);
  if (!val.trim() || val.length < 2) { closeDestDropdown(); return; }
  destAcTimer = setTimeout(() => fetchDestSuggestions(val), 300);
}

async function fetchDestSuggestions(query) {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
    const data = await res.json();
    destAcResults = data.results || [];
    renderDestDropdown();
  } catch { closeDestDropdown(); }
}

function renderDestDropdown() {
  const dd = document.getElementById("dest-dropdown");
  if (!dd) return;
  if (!destAcResults.length) { dd.style.display = "none"; return; }
  destAcIdx = -1;
  dd.innerHTML = destAcResults.map((r, i) => {
    const sub = [r.admin1, r.country].filter(Boolean).join(", ");
    return `<div class="dest-option" onmousedown="selectDestination(${i})">
      <div class="dest-option-name">${escapeHtml(r.name)}</div>
      ${sub ? `<div class="dest-option-sub">${escapeHtml(sub)}</div>` : ""}
    </div>`;
  }).join("");
  dd.style.display = "block";
}

function selectDestination(idx) {
  const r = destAcResults[idx];
  if (!r) return;
  const name = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
  const coords = { lat: r.latitude, lng: r.longitude };
  const t = currentTrip(); if (!t) return;
  weatherCache.delete(t.destination);
  t.destination = name;
  t.destinationCoords = coords;
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { destination: name, destLat: coords.lat, destLng: coords.lng } });
  render();
}

function onDestKeydown(e) {
  const dd = document.getElementById("dest-dropdown");
  if (!dd || dd.style.display === "none") return;
  if (e.key === "ArrowDown") { e.preventDefault(); destAcIdx = Math.min(destAcIdx + 1, destAcResults.length - 1); highlightDestOption(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); destAcIdx = Math.max(destAcIdx - 1, 0); highlightDestOption(); }
  else if (e.key === "Enter" && destAcIdx >= 0) { e.preventDefault(); selectDestination(destAcIdx); }
  else if (e.key === "Escape") { closeDestDropdown(); }
}

function highlightDestOption() {
  const dd = document.getElementById("dest-dropdown");
  if (!dd) return;
  [...dd.querySelectorAll(".dest-option")].forEach((el, i) => el.classList.toggle("ac-sel", i === destAcIdx));
}

function closeDestDropdown() {
  const dd = document.getElementById("dest-dropdown");
  if (dd) dd.style.display = "none";
  destAcResults = [];
  destAcIdx = -1;
}

// -------- NEW TRIP MODAL DESTINATION AUTOCOMPLETE --------
function onNtDestInput(val) {
  ntDestCoords = null; // clear stored coords when user types manually
  const dd = document.getElementById("nt-dest-dropdown");
  if (!val.trim() || val.length < 2) { closeNtDestDropdown(); return; }
  clearTimeout(destAcTimer);
  destAcTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=8&language=en&format=json`);
      const data = await res.json();
      ntDestAcResults = data.results || [];
      const dd2 = document.getElementById("nt-dest-dropdown");
      if (!dd2) return;
      ntDestAcIdx = -1;
      if (!ntDestAcResults.length) { dd2.style.display = "none"; return; }
      dd2.innerHTML = ntDestAcResults.map((r, i) => {
        const sub = [r.admin1, r.country].filter(Boolean).join(", ");
        return `<div class="dest-option" onmousedown="selectNtDest(${i})">
          <div class="dest-option-name">${escapeHtml(r.name)}</div>
          ${sub ? `<div class="dest-option-sub">${escapeHtml(sub)}</div>` : ""}
        </div>`;
      }).join("");
      dd2.style.display = "block";
    } catch { closeNtDestDropdown(); }
  }, 300);
}
function selectNtDest(idx) {
  const r = ntDestAcResults[idx];
  if (!r) return;
  const name = [r.name, r.admin1, r.country].filter(Boolean).join(", ");
  ntDestCoords = { lat: r.latitude, lng: r.longitude };
  const input = document.getElementById("nt-dest");
  if (input) input.value = name;
  closeNtDestDropdown();
}
function closeNtDestDropdown() {
  const dd = document.getElementById("nt-dest-dropdown");
  if (dd) dd.style.display = "none";
  ntDestAcResults = [];
  ntDestAcIdx = -1;
}

// -------- WEATHER WIDGET --------
const WMO_ICON = {
  0:"☀️", 1:"🌤️", 2:"⛅", 3:"☁️",
  45:"🌫️", 48:"🌫️",
  51:"🌦️", 53:"🌦️", 55:"🌧️",
  61:"🌧️", 63:"🌧️", 65:"🌧️",
  71:"❄️", 73:"❄️", 75:"❄️", 77:"🌨️",
  80:"🌦️", 81:"🌧️", 82:"⛈️",
  85:"🌨️", 86:"🌨️",
  95:"⛈️", 96:"⛈️", 99:"⛈️",
};
function wmoIcon(code) { return WMO_ICON[code] || "🌡️"; }

function renderWeatherWidget(t) {
  if (!t.destination || !t.startDate) return "";
  const start = parseDate(t.startDate);
  const end = t.endDate ? parseDate(t.endDate) : start;
  if (!start) return "";
  const today = new Date(); today.setHours(0,0,0,0);
  const diffStart = Math.round((start - today) / 86400000);
  const diffEnd = Math.round((end - today) / 86400000);
  if (diffEnd < 0) return "";
  if (diffStart > 7) {
    const daysUntilForecast = diffStart - 7;
    const unlockDate = new Date(today.getTime() + daysUntilForecast * 86400000);
    const unlockLabel = daysUntilForecast === 1 ? 'tomorrow' : unlockDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `<div class="stat overview-weather" style="padding:16px;">
      <div class="stat-label" style="margin-bottom:4px;">Weather forecast</div>
      <div style="font-size:12px;color:var(--ink-soft);line-height:1.6;">
        🗓️ Available in <strong>${daysUntilForecast}</strong> day${daysUntilForecast !== 1 ? 's' : ''}<br>
        <span style="font-size:11px;">7-day forecast unlocks ${unlockLabel}.</span>
      </div>
    </div>`;
  }

  const cached = weatherCache.get(t.destination);
  const isStale = !cached || (Date.now() - cached.fetchedAt > WEATHER_CACHE_TTL);
  if (isStale && !cached?.loading) fetchWeather(t.destination, t.destinationCoords);
  if (!cached || cached.loading) return `<div class="stat overview-weather" style="padding:16px;"><div class="stat-label">Weather forecast</div><div style="font-size:12px;color:var(--ink-soft);margin-top:8px;">Loading…</div></div>`;
  if (cached.error || !cached.data) return "";

  const { daily } = cached.data;
  if (!daily) return "";
  const _todayLocal = new Date();
  const todayStr = `${_todayLocal.getFullYear()}-${String(_todayLocal.getMonth()+1).padStart(2,'0')}-${String(_todayLocal.getDate()).padStart(2,'0')}`;
  const days = daily.time.slice(0, 7).map((date, i) => {
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const icon = wmoIcon(daily.weathercode[i]);
    const hi = Math.round(daily.temperature_2m_max[i]);
    const lo = Math.round(daily.temperature_2m_min[i]);
    const isToday = date === todayStr;
    return `<div class="weather-day${isToday ? " today" : ""}">
      <div class="weather-day-label">${isToday ? "Today" : label}</div>
      <div class="weather-icon">${icon}</div>
      <div class="weather-hi">${hi}°</div>
      <div class="weather-lo">${lo}°</div>
    </div>`;
  }).join("");

  return `<div class="stat overview-weather" style="padding:16px;">
    <div class="stat-label" style="margin-bottom:0;">Weather forecast</div>
    <div style="font-size:11px;color:var(--ink-soft);margin-bottom:2px;">${escapeHtml(t.destination)}</div>
    <div class="weather-strip">${days}</div>
  </div>`;
}

async function fetchWeather(destination, coords = null) {
  if (!destination) return;
  weatherCache.set(destination, { data: null, fetchedAt: Date.now(), loading: true });
  try {
    let loc = coords ? { latitude: coords.lat, longitude: coords.lng } : null;
    if (!loc) {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      loc = geoData.results?.[0];
      if (!loc) { weatherCache.set(destination, { data: null, fetchedAt: Date.now(), error: "Location not found" }); return; }
    }

    const fxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`);
    const fxData = await fxRes.json();
    weatherCache.set(destination, { data: fxData, fetchedAt: Date.now() });
  } catch {
    weatherCache.set(destination, { data: null, fetchedAt: Date.now(), error: "Failed" });
  }
  if (route.view === "trip" && route.tab === "overview") render();
}

function addPackCategory(listType) {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.packing = t.packing || [];
  const category = { id: uid(), name: "New category", listType: listType || "packing", items: [] };
  t.packing.push(category);
  mutate({ type: 'addPackCategory', tripId: t.id, category });
  tripPanelRender();
}
function updatePackCat(ci, name) {
  if (!guardEdit()) return;
  const cat = currentTrip().packing[ci];
  cat.name = name;
  mutate({ type: 'updatePackCategory', categoryId: cat.id, name });
}
function deletePackCat(ci) {
  if (!guardEdit()) return;
  if (!confirm("Delete this category and all its items?")) return;
  const t = currentTrip();
  const [removed] = t.packing.splice(ci, 1);
  mutate({ type: 'deletePackCategory', categoryId: removed.id });
  tripPanelRender();
}
function addPackItem(ci, name) {
  if (!guardEdit()) return;
  name = name.trim(); if (!name) return;
  const t = currentTrip();
  const item = { id: uid(), name, packed: false, assignedTo: [] };
  t.packing[ci].items.push(item);
  mutate({ type: 'addPackItem', categoryId: t.packing[ci].id, item });
  tripPanelRender();
}
function updatePackItem(ci, ii, name) {
  if (!guardEdit()) return;
  const item = currentTrip().packing[ci].items[ii];
  item.name = name;
  mutate({ type: 'updatePackItem', itemId: item.id, name });
}
function openPackItemAssigneeModal(ci, ii) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const item = t.packing[ci]?.items[ii];
  if (!item) return;
  openAssigneePickerModal({
    tripId: t.id,
    current: item.assignedTo || [],
    onSave: (names) => updatePackItemAssignees(ci, ii, names)
  });
}
function updatePackItemAssignees(ci, ii, names) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const item = t.packing[ci]?.items[ii];
  if (!item) return;
  item.assignedTo = names;
  mutate({ type: 'updatePackItem', itemId: item.id, assignedTo: names });
  tripPanelRender();
}
function togglePack(ci, ii) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const cat = t.packing[ci];
  const it = cat.items[ii];
  it.packed = !it.packed;
  mutate({ type: 'updatePackItem', itemId: it.id, packed: it.packed });
  const catEl = document.querySelector(`.pack-cat[data-ci="${ci}"]`);
  if (catEl && route.tab === "packing") {
    const row = catEl.querySelector(`.pack-item[data-ii="${ii}"]`);
    if (row) {
      row.classList.toggle("checked", it.packed);
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = it.packed;
    }
    const items = cat.items;
    const total = items.length;
    const done = items.filter(i => i.packed).length;
    const prog = catEl.querySelector(".pack-cat-progress");
    if (prog) prog.textContent = `${done}/${total}`;
    const fill = catEl.querySelector(".pack-bar-fill");
    if (fill) fill.style.setProperty('--pct', total ? (done / total) : 0);
    if ((cat.listType || "packing") === "shopping") {
      const canMove = total > 0 && done === total;
      let moveBtn = catEl.querySelector(".pack-move-btn");
      if (canMove && !moveBtn) {
        moveBtn = document.createElement("button");
        moveBtn.className = "btn sm primary no-print pack-move-btn";
        moveBtn.style.cssText = "width:100%;justify-content:center;margin-top:8px;";
        moveBtn.textContent = "✓ All bought — Move to Packing List";
        moveBtn.onclick = () => movePackCategoryToPacking(ci);
        catEl.querySelector(".pack-items").insertAdjacentElement("afterend", moveBtn);
      } else if (!canMove && moveBtn) {
        moveBtn.remove();
      }
    }
    updateTripHeaderStats(t);
    return;
  }
  tripPanelRender();
}
function deletePackItem(ci, ii) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const [removed] = t.packing[ci].items.splice(ii, 1);
  mutate({ type: 'deletePackItem', itemId: removed.id });
  tripPanelRender();
}

Object.assign(window, {
  renderPrepPanel, renderPackList, setPrepSubTab, loadPackingTemplate, movePackCategoryToPacking,
  onDestInput, onDestKeydown, selectDestination, closeDestDropdown, highlightDestOption,
  onNtDestInput, selectNtDest, closeNtDestDropdown,
  renderWeatherWidget,
  addPackCategory, updatePackCat, deletePackCat, addPackItem, updatePackItem, togglePack, deletePackItem,
  openPackItemAssigneeModal, updatePackItemAssignees,
  getNtDestCoords: () => ntDestCoords,
  resetNtDestCoords: () => { ntDestCoords = null; },
});

