import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
// Bridges – resolved at call-time via window (no circular imports needed)
// NOTE: render is defined in this file — no bridge needed for it.
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
const isEditing   = () => window.isEditing();
const isShareMode = () => window.isShareMode();
const renderDocuments = t => window.renderDocuments(t);


const ALL_TABS    = ["overview","itinerary","expenses","packing","reservations","notes","photos","documents"];
const TAB_LABELS  = { overview:"Overview", itinerary:"Itinerary", expenses:"Expenses",
                      packing:"Packing", reservations:"Reservations", notes:"Notes", photos:"Photos", documents:"Docs" };
const NOTE_COLORS = ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#ffe4e6"];

// -------- RENDER --------
function render() {
  document.documentElement.setAttribute("data-theme", state.settings.theme || "beach");
  window.stopTzClock?.(); window.stopItinClock?.();
  const root = document.getElementById("app-root");
  if (route.view === "home") root.innerHTML = renderHome();
  else if (route.view === "trip") root.innerHTML = renderTrip();
  document.querySelectorAll("textarea.autogrow:not([data-autogrow-bound])").forEach(autoGrow);
  if (route.view === "trip" && currentTrip()?.timezone) window.startTzClock?.();
  if (route.view === "trip" && route.tab === "itinerary") {
    requestAnimationFrame(() => {
      window.applyItineraryTimeState?.();
      window.renderCurrentTimeLine?.();
    });
    window.startItinClock?.();
  }
  if (route.view === "trip" && route.tab === "photos") window.setupPhotoLazyLoad?.();
  if (route.view === "trip" && route.tab === "documents") {
    const t = currentTrip();
    if (t && state._docs?.[t.id] === undefined) window.loadDocuments?.(t.id);
  }
  if (route.view === "home") setupPastYearScrubber();
}

function autoGrow(el) {
  if (el.dataset.autogrowBound) return;
  el.dataset.autogrowBound = "1";
  // Defer height read to rAF so it runs inside the browser's render cycle,
  // not as a forced mid-event layout flush.
  let rafId;
  const adjust = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      el.style.height = "0";
      el.style.height = (el.scrollHeight + 2) + "px";
    });
  };
  el.addEventListener("input", adjust);
  adjust();
}

function buildPrintHtml(t) {
  return `
    ${renderOverview(t)}
    <h2 style="margin:24px 0 12px;">Itinerary</h2>
    ${renderItinerary(t)}
    <h2 style="margin:24px 0 12px;">Expenses</h2>
    ${renderExpenses(t, true)}
    <h2 style="margin:24px 0 12px;">Packing List</h2>
    ${renderPacking(t)}
    <h2 style="margin:24px 0 12px;">Reservations</h2>
    ${renderReservations(t, true)}
    ${getNotes(t).length ? `<h2 style="margin:24px 0 12px;">Notes</h2><div class="panel"><div class="sticky-board">${getNotes(t).map((n,i)=>`<div class="sticky-note" style="background:${NOTE_COLORS[i%NOTE_COLORS.length]};pointer-events:none"><div style="font-size:13px;line-height:1.6;white-space:pre-wrap">${escapeHtml(n.text)}</div></div>`).join("")}</div></div>` : ""}
  `;
}

function injectPrintContent() {
  const t = currentTrip();
  const printRoot = document.getElementById("print-root");
  if (!t || !printRoot || route.view !== "trip") return;
  printRoot.innerHTML = buildPrintHtml(t);
  document.querySelectorAll("#print-root textarea.autogrow:not([data-autogrow-bound])").forEach(autoGrow);
}

function clearPrintContent() {
  const printRoot = document.getElementById("print-root");
  if (printRoot) printRoot.innerHTML = "";
}

window.addEventListener("beforeprint", injectPrintContent);
window.addEventListener("afterprint", clearPrintContent);

function getTripHeaderStats(t) {
  const totalSpend = (t.expenses || []).reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const _myTraveler = getMyTraveler(t.id);
  const myExpensesTotal = _myTraveler
    ? (t.expenses || []).filter(e => expenseParticipants(e, t.travelers || []).includes(_myTraveler))
        .reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
    : null;
  const reservOpen = (t.reservations || []).filter(r => r.status !== "booked" && r.status !== "cancelled" && r.name?.trim()).length;
  const packTotal = (t.packing || []).reduce((s, c) => s + c.items.length, 0);
  const packDone = (t.packing || []).reduce((s, c) => s + c.items.filter(i => i.packed).length, 0);
  return { totalSpend, myExpensesTotal, reservOpen, packDone, packTotal };
}

function updateTripHeaderStats(t) {
  if (!t) t = currentTrip();
  if (!t) return;
  const { totalSpend, myExpensesTotal, reservOpen, packDone, packTotal } = getTripHeaderStats(t);
  const el = (id) => document.getElementById(id);
  const spend = el("stat-total-spend");
  if (spend) spend.textContent = fmtCurrency(totalSpend);
  const mine = el("stat-my-expenses");
  if (mine) mine.textContent = fmtCurrency(myExpensesTotal);
  const packed = el("stat-packed");
  if (packed) packed.textContent = `${packDone}/${packTotal}`;
  const book = el("stat-to-book");
  if (book) book.textContent = String(reservOpen);
}

function renderExpensesPanel() {
  const t = currentTrip();
  const root = document.getElementById("expenses-root");
  if (!t || !root) return false;
  root.innerHTML = renderExpenses(t);
  root.querySelectorAll("textarea.autogrow:not([data-autogrow-bound])").forEach(autoGrow);
  updateTripHeaderStats(t);
  return true;
}

function renderPackingPanel() {
  const t = currentTrip();
  const root = document.getElementById("packing-root");
  if (!t || !root) return false;
  root.innerHTML = renderPacking(t);
  root.querySelectorAll("textarea.autogrow:not([data-autogrow-bound])").forEach(autoGrow);
  updateTripHeaderStats(t);
  return true;
}

function renderReservationsPanel() {
  const t = currentTrip();
  const root = document.getElementById("reservations-root");
  if (!t || !root) return false;
  root.innerHTML = renderReservations(t);
  root.querySelectorAll("textarea.autogrow:not([data-autogrow-bound])").forEach(autoGrow);
  return true;
}

function tripPanelRender() {
  if (route.view !== "trip") { render(); return; }
  if (route.tab === "expenses" && renderExpensesPanel()) return;
  if (route.tab === "packing" && renderPackingPanel()) return;
  if (route.tab === "reservations" && renderReservationsPanel()) return;
  render();
}

// -------- TRIP DETAIL --------
function renderTrip() {
  const t = currentTrip();
  if (!t) { goHome(); return ""; }
  const dU = daysUntil(t.startDate);
  const dEnd = daysUntil(t.endDate);
  let cdLabel = "";
  if (dU === null) cdLabel = "Add dates →";
  else if (dU > 0) cdLabel = `${dU} days until departure`;
  else if (dU === 0) cdLabel = "🎉 Today's the day!";
  else if (dEnd !== null && dEnd >= 0) cdLabel = "✈️ Trip in progress";
  else cdLabel = `${-dU} days ago`;

  const nights = tripDuration(t);
  const { totalSpend, myExpensesTotal, reservOpen, packDone, packTotal } = getTripHeaderStats(t);
  const _myTraveler = getMyTraveler(t.id);

  const allowedTabs = window._shareTabs || ALL_TABS;
  if (!allowedTabs.includes(route.tab)) {
    route.tab = allowedTabs[0] || "overview";
  }
  const tab = route.tab;
  return `
    <div class="trip-header">
      <div class="trip-header-row">
        ${getTripThumbnailUrl(t)
          ? `<div class="trip-emoji" onclick="openTripAvatarMenu()" title="Photo options" style="padding:0;overflow:hidden;cursor:pointer;"><img src="${escapeAttr(getTripThumbnailUrl(t))}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:22px;" /></div>`
          : `<div class="trip-emoji" onclick="openEmojiPicker()" title="Change icon">${t.emoji}</div>`
        }
        <div class="trip-meta">
          <div class="trip-title">
            <input value="${escapeHtml(t.title)}" oninput="updateTrip('title', this.value)" placeholder="Trip name" ${isEditing() ? '' : 'readonly'} />
          </div>
        </div>
      </div>
      <div class="trip-sub">
        <div class="trip-sub-loc-tz">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${isEditing() ? `<div class="dest-ac-wrap">
              <input id="dest-ac-input" style="background:transparent;border:none;color:inherit;font:inherit;width:200px;"
                     value="${escapeHtml(t.destination)}" oninput="onDestInput(this.value)" onkeydown="onDestKeydown(event)"
                     onblur="setTimeout(closeDestDropdown,200)" placeholder="Destination" autocomplete="off" />
              <div id="dest-dropdown" class="dest-dropdown"></div>
            </div>` : `<input style="background:transparent;border:none;color:inherit;font:inherit;width:200px;" value="${escapeHtml(t.destination)}" placeholder="Destination" readonly />`}
          </span>
          ${isEditing() ? `
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <select style="background:transparent;border:none;color:inherit;font:inherit;font-size:13px;cursor:pointer;max-width:220px;"
                    onchange="updateTrip('timezone', this.value)" title="Destination time zone">
              <option value="">Time zone (optional)</option>
              ${getTimezoneOptions(t.timezone || "")}
            </select>
          </span>` : (t.timezone ? `
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${t.timezone.replace(/_/g," ")}
          </span>` : "")}
        </div>
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <input type="date" style="background:transparent;border:none;color:inherit;font:inherit;"
                 value="${t.startDate}" onchange="updateTripDates('start', this.value)" ${isEditing() ? '' : 'readonly'} />
          →
          <input type="date" style="background:transparent;border:none;color:inherit;font:inherit;"
                 value="${t.endDate}" onchange="updateTripDates('end', this.value)" ${isEditing() ? '' : 'readonly'} />
        </span>
      </div>
      <div class="trip-actions-bar no-print">
        <button class="btn ghost share-hidden trip-back-btn" onclick="goHome()" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          All trips
        </button>
        <button class="btn edit-action" onclick="openShareModal('${t.id}')" title="Share this trip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
        <button class="btn danger edit-action" onclick="confirmDeleteTrip()" title="Delete trip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
      <div class="trip-stats">
        <div class="stat"><div class="stat-label">Countdown</div><div class="stat-value primary">${cdLabel}</div></div>
        <div class="stat"><div class="stat-label">Duration</div><div class="stat-value">${nights ? nights + (nights===1?" day":" days") : "—"}</div></div>
        <div class="stat"><div class="stat-label">Travelers</div><div class="stat-value">${(t.travelers||[]).length || "—"}</div></div>
        ${allowedTabs.includes("expenses") ? `<div class="stat"><div class="stat-label">Total spend</div><div class="stat-value accent" id="stat-total-spend">${fmtCurrency(totalSpend)}</div><div style="font-size:11px;color:var(--ink-soft);margin-top:2px;">all expenses</div></div>` : ""}
        ${allowedTabs.includes("expenses") && _myTraveler ? `<div class="stat"><div class="stat-label">Your expenses</div><div class="stat-value" id="stat-my-expenses">${fmtCurrency(myExpensesTotal)}</div><div style="font-size:11px;color:var(--ink-soft);margin-top:2px;">as ${escapeHtml(_myTraveler)}</div></div>` : ""}
        ${allowedTabs.includes("packing") ? `<div class="stat"><div class="stat-label">Packed</div><div class="stat-value" id="stat-packed">${packDone}/${packTotal}</div></div>` : ""}
        ${allowedTabs.includes("reservations") ? `<div class="stat"><div class="stat-label">To book</div><div class="stat-value" id="stat-to-book">${reservOpen}</div></div>` : ""}
        ${(() => { const tasks = t.tasks || []; const done = tasks.filter(tk => tk.status === 'done').length; return tasks.length ? `<div class="stat"><div class="stat-label">Tasks</div><div class="stat-value" id="stat-tasks">${done}/${tasks.length}</div></div>` : ""; })()}
        ${t.timezone ? `<div class="stat" id="tz-stat"><div class="stat-label">Local time</div><div class="stat-value" id="tz-clock">—</div></div>` : ""}
      </div>
    </div>

    <div class="tabs no-print" style="align-items:center;justify-content:space-around">
      ${allowedTabs.includes("overview") ? tabBtn("overview", "Overview", svgIcon("home")) : ""}
      ${allowedTabs.includes("itinerary") ? tabBtn("itinerary", "Itinerary", svgIcon("calendar")) : ""}
      ${allowedTabs.includes("expenses") ? tabBtn("expenses", "Expenses", svgIcon("dollar")) : ""}
      ${allowedTabs.includes("packing") ? tabBtn("packing", "Packing", svgIcon("luggage")) : ""}
      ${allowedTabs.includes("reservations") ? tabBtn("reservations", "Reservations", svgIcon("bookmark")) : ""}
      ${allowedTabs.includes("notes") ? tabBtn("notes", "Notes", svgIcon("edit")) : ""}
      ${allowedTabs.includes("photos") ? tabBtn("photos", "Photos", svgIcon("camera")) : ""}
      ${(!isShareMode() && allowedTabs.includes("documents")) ? tabBtn("documents", "Docs", svgIcon("lock")) : ""}
    </div>

    ${tab === "overview" ? renderOverview(t) : ""}
    ${tab === "itinerary" ? renderItinerary(t) : ""}
    ${tab === "expenses" ? `<div id="expenses-root">${renderExpenses(t)}</div>` : ""}
    ${tab === "packing" ? `<div id="packing-root">${renderPacking(t)}</div>` : ""}
    ${tab === "reservations" ? `<div id="reservations-root">${renderReservations(t)}</div>` : ""}
    ${tab === "notes" ? renderNotes(t) : ""}
    ${tab === "photos" ? renderPhotos(t) : ""}
    ${tab === "documents" && !isShareMode() ? renderDocuments(t) : ""}
  `;
}

function tabBtn(key, label, iconHtml) {
  const active = route.tab === key ? "active" : "";
  return `<button class="tab ${active}" onclick="setTab('${key}')">${iconHtml}${label}</button>`;
}

function svgIcon(name) {
  const icons = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    dollar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    luggage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><line x1="9" y1="11" x2="9" y2="17"/><line x1="15" y1="11" x2="15" y2="17"/></svg>',
    bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    qr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M17 21v-4"/><path d="M14 17v4"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 3l.75 2.75L8.5 7l-2.75.75L5 10.5l-.75-2.75L1.5 7l2.75-.75L5 3z" opacity=".5"/><path d="M19 14l.75 2.75L22.5 18l-2.75.75L19 21.5l-.75-2.75L15.5 18l2.75-.75L19 14z" opacity=".5"/></svg>',
    image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };
  return icons[name] || "";
}

Object.assign(window, {
  render, autoGrow, renderTrip, tabBtn, svgIcon,
  buildPrintHtml, updateTripHeaderStats, getTripHeaderStats,
  renderExpensesPanel, renderPackingPanel, renderReservationsPanel, tripPanelRender,
});

