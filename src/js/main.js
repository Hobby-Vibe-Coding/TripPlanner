import './utils.js';
import './state.js';
import './auth.js';
import './modals.js';
import './auth-modal.js';
import './pwa-install.js';
import './calculator.js';
import './notes.js';
import './reservations.js';
import './packing.js';
import './photos.js';
import './expenses.js';
import './itinerary.js';
import './overview.js';
import './documents.js';
import './share.js';
import './settings.js';
import './trips.js';
import './home.js';
import './render.js';

import { state, route, currentUser, setCurrentUser, setState, loadState } from './state.js';
import { updateHeaderUI } from './auth.js';
import { getToken } from './utils.js';

// -------- INITIAL --------
document.addEventListener("DOMContentLoaded", async () => {
  // Apply cached theme immediately — zero flicker on return visits.
  const cachedTheme = localStorage.getItem("tp_theme") || "beach";
  document.documentElement.setAttribute("data-theme", cachedTheme);

  // Register PWA service worker.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  // Handle shared trip link: ?share=<token> — no auth required.
  const shareToken = new URLSearchParams(location.search).get("share");
  if (shareToken) {
    await loadSharedTrip(shareToken);
    return;
  }

  // Restore session from localStorage JWT.
  const storedToken = getToken();
  if (storedToken) {
    try { setCurrentUser(JSON.parse(atob(storedToken.split(".")[1]))); }
    catch { setCurrentUser(null); }
  }

  if (currentUser) {
    updateHeaderUI();
    setState(await loadState());
    window.render();
  } else {
    window.showLoginModal();
  }

  document.addEventListener("keydown", e => {
    if (document.getElementById("lightbox-bg")) {
      if (e.key === "Escape")      window.closeLightbox();
      else if (e.key === "ArrowLeft")  window.moveLightbox(-1);
      else if (e.key === "ArrowRight") window.moveLightbox(1);
    }
  });
});

const ALL_TABS = ["overview","itinerary","expenses","packing","reservations","notes","photos"];

async function loadSharedTrip(token) {
  document.getElementById("app-root").innerHTML =
    `<div style="text-align:center;padding:60px 20px;color:var(--ink-soft);">Loading shared trip…</div>`;
  try {
    const res = await fetch(`/api/share/${token}`);
    if (!res.ok) throw new Error("not found");
    const { trip, settings, mode } = await res.json();

    setState({ trips: [trip], settings: settings || { theme: "beach", currency: "USD" } });

    document.documentElement.setAttribute("data-share", mode === "edit" ? "edit" : "read");

    const banner = document.getElementById("share-banner");
    banner.style.display = "";

    if (mode === "edit") {
      window._shareToken = token;
      banner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0;">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Editing shared trip — changes save automatically`;
    } else {
      banner.innerHTML = `🔗 Shared view — read only`;
    }

    const tabsParam = new URLSearchParams(location.search).get("tabs");
    window._shareTabs = tabsParam ? tabsParam.split(",").filter(t => ALL_TABS.includes(t)) : null;

    const firstTab = window._shareTabs ? window._shareTabs[0] : "overview";
    // Mutate route in-place (imported live binding — only state.js can reassign)
    Object.assign(route, { view: "trip", tripId: trip.id, tab: firstTab || "overview" });
    window.render();

    if (!window.getMyTraveler(trip.id) && (trip.travelers || []).length > 0) {
      window.showTravelerSelectModal(trip);
    }
  } catch {
    document.getElementById("app-root").innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🔗</div>
        <h3>Share link not found</h3>
        <p style="color:var(--ink-soft);">This link may have expired or been removed.</p>
        <button class="btn primary" onclick="location.href='/'">Go home</button>
      </div>`;
  }
}
