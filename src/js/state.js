import { getToken } from './utils.js';

// Bridge — render is in render.js (loaded after state.js, called at runtime only)
const render = () => window.render();

// -------- STATE / STORAGE --------
export const DEFAULT_STATE = () => ({ trips: [], settings: { theme: "beach", currency: "USD" } });

export async function loadState() {
  try {
    const res = await fetch("/api/data", {
      headers: { Authorization: `Bearer ${getToken()}` },
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
    fetch(`/api/share/${window._shareToken}`, {
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
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
  if (n === null || n === undefined || isNaN(n)) return "\u2014";
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
  const el = document.getElementById(`past-year-${y}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Window exports
Object.assign(window, {
  saveState, loadState, currentTrip, setSimplifyDebts, fmtCurrency, setTheme,
  goHome, openTrip, setTab, setPastYearFilter, scrollPastYearIntoView,
});

