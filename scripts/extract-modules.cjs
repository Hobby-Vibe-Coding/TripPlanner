// Module extraction script — run with: node scripts/extract-modules.js
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '../src/js/main.js');
const src = fs.readFileSync(mainPath, 'utf8');
const L = src.split('\n');

function lines(a, b) { return L.slice(a - 1, b).join('\n').trimEnd(); }

function write(file, content) {
  const p = path.join(__dirname, '../src/js', file);
  fs.writeFileSync(p, content.trimStart() + '\n', 'utf8');
  console.log(`  ${file.padEnd(24)} ${content.trimStart().split('\n').length} lines`);
}

const BRIDGES = `
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
`.trimStart();

const STATE_IMPORT = `import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';`;

// ── utils.js ──────────────────────────────────────────────────────────────────
write('utils.js', `
// Token storage — pure localStorage helpers, no state dependency
function getToken() { return localStorage.getItem("tp_token"); }
function setToken(t) { localStorage.setItem("tp_token", t); }

${lines(31, 161)}

${lines(162, 263)}

// -------- HELPERS --------
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
${lines(397, 429)}
function tripDuration(t) {
  if (!t.startDate || !t.endDate) return null;
  return daysBetween(parseDate(t.startDate), parseDate(t.endDate)) + 1;
}
function escapeAttr(s) { return String(s).replace(/'/g, "\\\\'").replace(/"/g, '&quot;'); }

// Window exports
Object.assign(window, {
  getToken, setToken,
  parseTime12, formatTime12, nextTimeStr, slotEndLabel, allHalfHourTimes, generateSlotsFromRange,
  getTimezoneOptions,
  tickTzClock, startTzClock, stopTzClock,
  tickItinClock, startItinClock, stopItinClock,
  applyItineraryTimeState, renderCurrentTimeLine, parseSlotTime,
  uid, escapeHtml, escapeAttr, parseDate, daysBetween, daysUntil, fmtDate, fmtBookingTime, tripDuration,
});
`);

// ── state.js ──────────────────────────────────────────────────────────────────
write('state.js', `
import { getToken } from './utils.js';

// Bridge — render is in render.js (loaded after state.js, called at runtime only)
const render = () => window.render();

// -------- STATE / STORAGE --------
export const DEFAULT_STATE = () => ({ trips: [], settings: { theme: "beach", currency: "USD" } });

export async function loadState() {
  try {
    const res = await fetch("/api/data", {
      headers: { Authorization: \`Bearer \${getToken()}\` },
    });
    if (res.status === 401) { window.clearToken(); return DEFAULT_STATE(); }
    if (!res.ok) throw new Error("fetch failed");
    const s = await res.json();
    s.trips = s.trips || [];
    s.trips.forEach(t => {
      if (!t.driveFolder) t.driveFolder = { folderId: null, thumbnailId: null, thumbnailUrl: null };
      else if (!('thumbnailUrl' in t.driveFolder)) t.driveFolder.thumbnailUrl = null;
    });
    s.settings = Object.assign({ theme: "beach", currency: "USD" }, s.settings || {});
    return s;
  } catch {
    return DEFAULT_STATE();
  }
}
export function saveState() {
  if (isShareMode() && window._shareToken) {
    const trip = currentTrip();
    if (!trip) return;
    fetch(\`/api/share/\${window._shareToken}\`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip }),
    }).catch(console.error);
    return;
  }
  const token = getToken();
  if (!token) return;
  fetch("/api/data", {
    method: "PUT",
    headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).catch(console.error);
}

export let state        = DEFAULT_STATE();
export let route        = { view: "home", tripId: null, tab: "overview" };
export let currentUser  = null;
export let pastYearFilter  = "all";
export let simplifyDebts   = localStorage.getItem('tp_simplify_debts') !== 'false';
export let travEditMode    = false;

// Setters — only the exporting module can reassign exported lets
export function setState(s)          { state = s; }
export function setCurrentUser(u)    { currentUser = u; }
export function setTravEditMode(v)   { travEditMode = v; }
export function setSimplifyDebts(v)  { simplifyDebts = v; localStorage.setItem('tp_simplify_debts', v); render(); }

// State helpers
export function fmtCurrency(n) {
  const cur = state.settings.currency || "USD";
  if (n === null || n === undefined || isNaN(n)) return "\\u2014";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(n); }
  catch { return "$" + Number(n).toFixed(2); }
}
export function setTheme(themeId) {
  if (!window.guardEdit()) return;
  document.documentElement.setAttribute("data-theme", themeId);
  state.settings.theme = themeId;
  if (currentUser) localStorage.setItem("tp_theme", themeId);
  saveState();
}

// -------- ROUTING --------
function isShareMode() { return document.documentElement.hasAttribute("data-share"); }
export function currentTrip() { return state.trips.find(t => t.id === route.tripId); }
export function goHome() {
  setTravEditMode(false);
  route = { view: "home", tripId: null, tab: "overview" };
  render();
}
export function openTrip(id, tab) {
  if (typeof window.itinMobileDay !== 'undefined') window.itinMobileDay = 0;
  setTravEditMode(false);
  route = { view: "trip", tripId: id, tab: tab || "overview" };
  render();
}
export function setTab(t) { setTravEditMode(false); route.tab = t; render(); }
export function setPastYearFilter(y) {
  pastYearFilter = y;
  render();
  requestAnimationFrame(() => scrollPastYearIntoView(y));
}
export function scrollPastYearIntoView(y) {
  if (y === "all") {
    const root = document.getElementById("past-root");
    if (root) root.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const el = document.getElementById(\`past-year-\${y}\`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Window exports
Object.assign(window, {
  saveState, loadState, currentTrip, setSimplifyDebts, fmtCurrency, setTheme,
  goHome, openTrip, setTab, setPastYearFilter, scrollPastYearIntoView,
});
`);

// ── auth.js ───────────────────────────────────────────────────────────────────
write('auth.js', `
import { currentUser, setCurrentUser, setState, DEFAULT_STATE } from './state.js';
import { getToken, setToken } from './utils.js';

export function clearToken() {
  localStorage.removeItem("tp_token");
  localStorage.removeItem("tp_theme");
  setCurrentUser(null);
  setState(DEFAULT_STATE());
  const root = document.getElementById("app-root");
  if (root) root.innerHTML = "";
  updateHeaderUI();
  window.showLoginModal();
}
export function updateHeaderUI() {
  const btn   = document.getElementById("user-btn");
  const label = document.getElementById("user-label");
  if (currentUser) {
    if (btn)   btn.style.display = "";
    if (label) label.textContent = currentUser.username;
  } else {
    if (btn) btn.style.display = "none";
  }
}
export function openUserMenu() {
  if (confirm(\`Signed in as "\${currentUser?.username}"\\n\\nSign out?\`)) clearToken();
}
export function isLoggedIn()  { return !!currentUser; }
export function isShareMode() { return document.documentElement.hasAttribute("data-share"); }
export function isEditing() {
  if (currentUser) return true;
  return document.documentElement.getAttribute("data-share") === "edit";
}
export function guardEdit() {
  if (isEditing()) return true;
  if (isShareMode()) {
    window.showModal({
      title: "Read-only view", size: "sm",
      body: '<p style="margin:0;line-height:1.6;">This trip was shared with you in <strong>read-only</strong> mode — you can view but not make changes.</p>',
      actions: [{ label: "Got it", primary: true, onClick: () => window.closeModal() }],
    });
    return false;
  }
  if (!currentUser) { window.showLoginModal(); }
  return false;
}

// Window exports
Object.assign(window, {
  clearToken, updateHeaderUI, openUserMenu,
  isLoggedIn, isShareMode, isEditing, guardEdit,
});
`);

// ── modals.js ─────────────────────────────────────────────────────────────────
write('modals.js', `
${lines(3629, 3653)}

Object.assign(window, { showModal, closeModal });
`);

// ── auth-modal.js ─────────────────────────────────────────────────────────────
write('auth-modal.js', `
${STATE_IMPORT}
import { setCurrentUser, updateHeaderUI, clearToken } from './auth.js';
import { setToken, getToken } from './utils.js';

const render = () => window.render();

${lines(3655, 3791)}

Object.assign(window, { showLoginModal, switchAuthTab, submitLogin, submitRegister });
`);

// ── calculator.js ─────────────────────────────────────────────────────────────
write('calculator.js', `
${lines(4039, 4109)}

Object.assign(window, { openCalc, calcPress });
`);

// ── notes.js ──────────────────────────────────────────────────────────────────
write('notes.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(3179, 3233)}

Object.assign(window, { renderNotes, addNote, removeNote, updateNote });
`);

// ── reservations.js ───────────────────────────────────────────────────────────
write('reservations.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(3105, 3177)}

Object.assign(window, { renderReservations, addRes, updateRes, deleteRes });
`);

// ── packing.js ────────────────────────────────────────────────────────────────
write('packing.js', `
${STATE_IMPORT}
${BRIDGES}

// Packing-local state
let ntDestAcResults = [];
let ntDestAcIdx     = -1;
let ntDestCoords    = null;
const weatherCache     = new Map();
const WEATHER_CACHE_TTL = 60 * 60 * 1000;
let destAcTimer = null;
let destAcIdx   = -1;
let destAcResults = [];

${lines(2812, 2945)}

${lines(2946, 2987)}

${lines(2988, 3104)}

Object.assign(window, {
  renderPacking, loadPackingTemplate,
  onDestInput, onDestKeydown, selectDestination, closeDestDropdown, highlightDestOption,
  onNtDestInput, selectNtDest, closeNtDestDropdown,
  renderWeatherWidget,
  addPackCategory, updatePackCat, deletePackCat, addPackItem, updatePackItem, togglePack, deletePackItem,
  // expose ntDestCoords getter for trips.js openNewTrip
  getNtDestCoords: () => ntDestCoords,
  resetNtDestCoords: () => { ntDestCoords = null; },
});
`);

// ── photos.js ─────────────────────────────────────────────────────────────────
write('photos.js', `
${STATE_IMPORT}
${BRIDGES}

// Photos-local state
const driveCache          = new Map();
const DRIVE_CACHE_TTL     = 5 * 60 * 1000;
let lightboxFiles         = [];
let lightboxIdx           = 0;
const lightboxFullResReady = new Set();

${lines(3235, 3449)}

Object.assign(window, {
  renderPhotos, refreshDrivePhotos, openLinkDriveModal, unlinkDriveFolder,
  setTripThumbnail, openLightbox, moveLightbox, closeLightbox, openCoverPhotoLightbox, removeCoverPhoto,
  getFileThumbUrl, getTripThumbnailUrl,
});
`);

// ── expenses.js ───────────────────────────────────────────────────────────────
write('expenses.js', `
${STATE_IMPORT}
${BRIDGES}

const EXPENSE_CATEGORIES = ${JSON.stringify(["Transport","Lodging","Activities","Food","Shopping","Misc"])};
const SPLIT_METHODS = ${JSON.stringify([
  { id:"equal",   label:"Equal",   icon:"=",     desc:"Each traveler pays the same amount. Use when everyone benefited equally." },
  { id:"exact",   label:"Exact",   icon:"1.23",  desc:"Each traveler pays a fixed dollar amount you enter directly. Use when you've already worked out who owes what." },
  { id:"percent", label:"Percent", icon:"%",     desc:"Each traveler pays a percentage of the bill (must total 100%). Use for fixed long-term ratios." },
  { id:"shares",  label:"Shares",  icon:"\u2261", desc:"Each traveler pays in proportion to assigned shares. Use when one traveler owes 2\u00d7 another, etc." },
  { id:"adjust",  label:"Adjust",  icon:"+/\u2212", desc:"Equal split, then add or subtract a dollar amount per traveler. Use for one-off favors or fines." },
])};

${lines(1325, 1338)}

${lines(1872, 2811)}

Object.assign(window, {
  setExpensePage, setExpensePageSize, setExpenseSearch,
  expenseParticipants, computeSplit,
  renderExpenses,
  openSplitEditor, changeSplitMethod, updateSplitDetail, toggleSplitParticipant,
  setAllSplitParticipants, toggleGroupParticipants, splitAutoBalance,
  openPayerDialog, dialogTogglePayer, dialogToggleSettle,
  settleWithPerson, settleOneDebt, buildDetailedDebts,
  openPersonDetail,
  addExpense, updateExpense, deleteExpense,
});
`);

// ── itinerary.js ──────────────────────────────────────────────────────────────
write('itinerary.js', `
${STATE_IMPORT}
${BRIDGES}

let itinMobileDay = 0;
window.itinMobileDay = 0; // expose for state.js openTrip to reset

${lines(1339, 1871)}

Object.assign(window, {
  itinMobileDay,
  renderItinerary,
  navItinDay, showDaySummary, openTimeSlotsEditor, openResLinkPicker,
  linkSlotReservation, updateSlotField, updateDayTheme, updateSlot, deleteSlot,
  startSlotDrag, openActivityTimeDialog,
});
`);

// ── overview.js ───────────────────────────────────────────────────────────────
write('overview.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(854, 1323)}

Object.assign(window, {
  renderOverview,
  openGroupsModal, renderGroupsModal, dropTravelerIntoGroup,
  addGroup, renameGroup, deleteGroup,
  toggleTravEditMode, addTraveler, removeTraveler,
  getMyTraveler, setMyTraveler, computeMyData,
  selectTravelerFromModal,
});
`);

// ── share.js ──────────────────────────────────────────────────────────────────
write('share.js', `
${STATE_IMPORT}
${BRIDGES}

const ALL_TABS    = ["overview","itinerary","expenses","packing","reservations","notes","photos"];
const TAB_LABELS  = { overview:"Overview", itinerary:"Itinerary", expenses:"Expenses",
                      packing:"Packing", reservations:"Reservations", notes:"Notes", photos:"Photos" };

${lines(3793, 3914)}

${lines(3915, 4038)}

Object.assign(window, {
  updateShareReadLink, updateShareQR, toggleShareQR, openShareModal, copyShareLinkById,
  openHighlightCardModal, generateTripCard, downloadTripCard,
});
`);

// ── settings.js ───────────────────────────────────────────────────────────────
write('settings.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(4110, 4255)}

Object.assign(window, {
  openSettings, hardRefresh, pickTheme, updateCurrency, exportJson, importJson, resetAll,
});
`);

// ── trips.js ──────────────────────────────────────────────────────────────────
const PACKING_TEMPLATE = lines(7, 19);
write('trips.js', `
${STATE_IMPORT}
${BRIDGES}

${PACKING_TEMPLATE}

${lines(439, 494)}

${lines(3451, 3559)}

${lines(3560, 3628)}

Object.assign(window, {
  newTrip, deleteTrip, duplicateTrip,
  updateTrip, updateTripDates, syncItineraryToDateRange, confirmDeleteTrip,
  openTripAvatarMenu, closeAvatarMenu, openCoverPhotoLightbox: () => window.openCoverPhotoLightbox(), removeCoverPhoto: () => window.removeCoverPhoto(),
  openEmojiPicker, pickEmoji,
  openNewTrip, selectNtEmoji,
});
`);

// ── home.js ───────────────────────────────────────────────────────────────────
write('home.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(534, 582)}

${lines(583, 687)}

${lines(4341, 4553)}

Object.assign(window, {
  getOnThisDayTrips, renderOnThisDay,
  renderHome,
  getFileThumbUrl, getTripThumbnailUrl, renderTripCard, getTripMemoryLine, renderPostcard,
  setupPastYearScrubber, handlePostcardClick, openMemoryLineEditor,
});
`);

// ── render.js ─────────────────────────────────────────────────────────────────
write('render.js', `
${STATE_IMPORT}
${BRIDGES}

${lines(516, 533)}

${lines(688, 853)}

Object.assign(window, { render, autoGrow, renderTrip, tabBtn, svgIcon });
`);

console.log('\nAll modules written. Now updating main.js...');

// ── Build slim main.js ────────────────────────────────────────────────────────
const imports = `
import './utils.js';
import './state.js';
import './auth.js';
import './modals.js';
import './auth-modal.js';
import './calculator.js';
import './notes.js';
import './reservations.js';
import './packing.js';
import './photos.js';
import './expenses.js';
import './itinerary.js';
import './overview.js';
import './share.js';
import './settings.js';
import './trips.js';
import './home.js';
import './render.js';
`.trimStart();

// Keep only: DEFAULTS comment header + EXPENSE_CATEGORIES/SPLIT_METHODS (used in expenses inline) +
// the INITIAL section (init, loadSharedTrip, etc.) + the window exports block
const initSection = lines(4256, 4340);
const windowExports = lines(4555, L.length);

const newMain = imports + `
import { state, route, currentUser, setCurrentUser, setState, loadState } from './state.js';
import { updateHeaderUI, clearToken } from './auth.js';

// -------- INITIAL --------
${initSection}

${windowExports.replace(/Object\.assign\(window,[\s\S]*?\}\);/, '// (window exports moved to individual modules)')}
`.trimStart();

write('main.js', newMain);
console.log('\nDone!');
