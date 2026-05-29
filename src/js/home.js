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


// -------- ON THIS DAY --------
function getOnThisDayTrips() {
  const today = new Date();
  const yy = today.getFullYear();
  // Normalize today to a comparable number (month*100 + day)
  const todayMD = today.getMonth() * 100 + today.getDate();
  return state.trips.filter(t => {
    if (!t.startDate) return false;
    const start = parseDate(t.startDate);
    if (!start || start.getFullYear() >= yy) return false;
    const end = t.endDate ? parseDate(t.endDate) : start;
    // Check if today's m/d falls within the trip's m/d range (ignoring year)
    const startMD = start.getMonth() * 100 + start.getDate();
    const endMD = (end || start).getMonth() * 100 + (end || start).getDate();
    return todayMD >= startMD && todayMD <= endMD;
  });
}

function renderOnThisDay() {
  const trips = getOnThisDayTrips();
  if (!trips.length) return "";
  const today = new Date();
  if (trips.length === 1) {
    const t = trips[0];
    const yearsAgo = today.getFullYear() - parseDate(t.startDate).getFullYear();
    return `<div class="on-this-day-banner" onclick="openTrip('${t.id}')">
      <div style="font-size:28px;flex-shrink:0;">🗓️</div>
      <div class="on-this-day-content">
        <div class="on-this-day-label">On this day, ${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago</div>
        <div class="on-this-day-title">${escapeHtml(t.title)}</div>
        <div class="on-this-day-sub">${t.destination ? escapeHtml(t.destination) : ""}${t.memoryLine ? " · " + escapeHtml(t.memoryLine) : ""}</div>
      </div>
      <div style="font-size:20px;color:var(--ink-soft);">→</div>
    </div>`;
  }
  const chips = trips.map(t => {
    const yearsAgo = today.getFullYear() - parseDate(t.startDate).getFullYear();
    return `<div class="on-this-day-chip" onclick="openTrip('${t.id}')">
      <div class="on-this-day-label" style="margin-bottom:2px;">${yearsAgo}yr ago</div>
      <div style="font-size:13px;font-weight:600;">${escapeHtml(t.title)}</div>
      ${t.destination ? `<div style="font-size:12px;color:var(--ink-soft);">${escapeHtml(t.destination)}</div>` : ""}
    </div>`;
  }).join("");
  return `<div style="margin-bottom:16px;">
    <div class="on-this-day-label" style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--primary,#e07b39);">🗓️ On this day</div>
    <div class="on-this-day-multi">${chips}</div>
  </div>`;
}

// -------- HOME / DASHBOARD --------
let homeUpcomingLimit = 12;

function getHomeTripLists() {
  const trips = state.trips.slice().sort((a, b) => (a.startDate || "z").localeCompare(b.startDate || "z"));
  const upcoming = trips.filter(t => {
    const d = daysUntil(t.endDate); return d === null || d >= 0;
  });
  const past = trips.filter(t => {
    const d = daysUntil(t.endDate); return d !== null && d < 0;
  });
  return { trips, upcoming, past };
}

function renderUpcomingSection() {
  const { upcoming } = getHomeTripLists();
  const visible = upcoming.slice(0, homeUpcomingLimit);
  const hasMore = upcoming.length > visible.length;
  return `
    <div class="section-head">
      <h2>Upcoming <span class="muted">${upcoming.length} ${upcoming.length === 1 ? "trip" : "trips"}</span></h2>
    </div>
    <div class="trip-grid">
      ${visible.map(renderTripCard).join("")}
      <div class="trip-card new" onclick="openNewTrip()">
        <div class="plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
        <div>Plan a new trip</div>
      </div>
    </div>
    ${hasMore ? `<div style="text-align:center;margin-top:14px;"><button class="btn sm" onclick="loadMoreUpcoming()">Load more (${upcoming.length - visible.length} remaining)</button></div>` : ""}
  `;
}

function renderPastSection() {
  const { past } = getHomeTripLists();
  if (!past.length) return "";
  const pastYears = [...new Set(past.map(t => (t.startDate || "").slice(0, 4)).filter(Boolean))].sort((a, b) => a - b);
  const activeYear = pastYears.includes(pastYearFilter) ? pastYearFilter : "all";
  const yearCounts = pastYears.reduce((acc, y) => {
    acc[y] = past.filter(t => (t.startDate || "").startsWith(y)).length;
    return acc;
  }, {});
  const yearsToShow = activeYear === "all" ? pastYears : pastYears.filter(y => y === activeYear);
  const filteredCount = activeYear === "all"
    ? past.length
    : past.filter(t => (t.startDate || "").startsWith(activeYear)).length;
  const filteredTrips = activeYear === "all"
    ? past
    : past.filter(t => (t.startDate || "").startsWith(activeYear));

  const timelineHtml = `
    <div class="year-map" role="tablist" aria-label="Past years">
      <button class="year-pill-mini ${activeYear === 'all' ? 'active' : ''}" onclick="setPastYearFilter('all')">All</button>
      <div class="year-track" id="year-track">
        ${pastYears.map(y => `
          <div class="year-node ${activeYear === y ? 'active' : ''}" data-year="${y}" onclick="setPastYearFilter('${y}')" role="button">
            <div class="year-dot"></div>
            <div class="year-label">${y}</div>
            <div class="year-count">${yearCounts[y]}</div>
          </div>`).join("")}
        <div class="year-handle" id="year-handle"><div class="year-tooltip" id="year-tooltip"></div></div>
      </div>
    </div>`;

  const wallHtml = activeYear === "all"
    ? yearsToShow.map((y, idx) => {
        const tripsForYear = past.filter(t => (t.startDate || "").startsWith(y));
        return `
          <div class="past-year" id="past-year-${y}" data-year="${y}">
            <div class="past-year-header">${y} · ${tripsForYear.length} trip${tripsForYear.length === 1 ? "" : "s"}</div>
            <div class="postcard-row">
              ${tripsForYear.map((t, i) => renderPostcard(t, i + idx)).join("")}
            </div>
          </div>`;
      }).join("")
    : `<div class="postcard-grid">${filteredTrips.map(renderPostcard).join("")}</div>`;

  return `
    <section class="past-section" id="past-root">
      <div class="past-head">
        <div class="past-title">
          <h2>Past</h2>
          <span class="muted">${filteredCount} ${filteredCount === 1 ? "trip" : "trips"}</span>
        </div>
        ${timelineHtml}
      </div>
      <div class="postcard-wall">
        ${wallHtml}
      </div>
    </section>`;
}

function renderHome() {
  const { trips, upcoming } = getHomeTripLists();
  const nextTrip = upcoming.find(t => daysUntil(t.startDate) !== null);
  const heroSub = nextTrip
    ? `Your next adventure is <strong>${escapeHtml(nextTrip.title)}</strong> — ${daysUntil(nextTrip.startDate) > 0 ? daysUntil(nextTrip.startDate) + " days to go" : daysUntil(nextTrip.startDate) === 0 ? "starts today!" : "in progress"} 🎉`
    : "Let's plan something amazing. Tap <strong>New Trip</strong> to start.";

  return `
    <section class="hero">
      <div class="hero-text">
        <h1>Hey ${escapeHtml(currentUser?.username || "there")} — <span class="accent">where are we going?</span></h1>
        <p>${heroSub}</p>
      </div>
      <div class="hero-emoji">${state.trips.length ? "🌎" : "✈️"}</div>
    </section>

    ${renderOnThisDay()}

    ${trips.length === 0 ? `
      <div class="empty-state">
        <div class="e-emoji">🧭</div>
        <h3>No trips yet</h3>
        <p>Create your first trip and we'll set up packing lists, an itinerary, and an expense tracker for you.</p>
        <button class="btn primary lg" onclick="openNewTrip()">+ Plan my first trip</button>
      </div>
    ` : `
      <div id="home-upcoming-section">${renderUpcomingSection()}</div>
      <div id="home-past-section">${renderPastSection()}</div>
    `}
  `;
}

function renderHomeUpcoming() {
  const el = document.getElementById("home-upcoming-section");
  if (!el) { render(); return; }
  el.innerHTML = renderUpcomingSection();
}

function renderHomePast() {
  const el = document.getElementById("home-past-section");
  if (!el) { render(); return; }
  el.innerHTML = renderPastSection();
  setupPastYearScrubber();
}

function homePanelRender() {
  if (route.view !== "home") { render(); return; }
  renderHomeUpcoming();
  renderHomePast();
}

function loadMoreUpcoming() {
  homeUpcomingLimit += 12;
  renderHomeUpcoming();
}

function getFileThumbUrl(f, size = 400) {
  return f.thumbnailLink
    ? f.thumbnailLink.replace(/=s\d+$/, `=s${size}`)
    : `/api/drive/thumb?fileId=${encodeURIComponent(f.id)}&sz=${size}`;
}

function getTripThumbnailUrl(t) {
  const { thumbnailId } = t.driveFolder || {};
  return thumbnailId ? `/api/drive/thumb?fileId=${encodeURIComponent(thumbnailId)}` : null;
}

function renderTripCard(t) {
  const dU = daysUntil(t.startDate);
  const dEnd = daysUntil(t.endDate);
  let cdLabel, cdClass = "";
  if (dU === null) { cdLabel = "no date"; cdClass = "past"; }
  else if (dU > 0) cdLabel = `in ${dU}d`;
  else if (dU === 0) { cdLabel = "today!"; cdClass = "live"; }
  else if (dEnd !== null && dEnd >= 0) { cdLabel = "live now"; cdClass = "live"; }
  else { cdLabel = `${-dU}d ago`; cdClass = "past"; }

  const totalSpend = (t.expenses || []).reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const peopleCt = (t.travelers || []).length;
  const nights = tripDuration(t);
  const dates = (t.startDate || t.endDate)
    ? `${fmtDate(t.startDate, {month:"short",day:"numeric"})}${t.endDate ? " – " + fmtDate(t.endDate, {month:"short",day:"numeric",year:"numeric"}) : ""}`
    : "Dates TBD";

  return `
    <div class="trip-card" onclick="openTrip('${t.id}')">
      <div class="trip-card-cd ${cdClass}">${cdLabel}</div>
      ${(() => { const tu = getTripThumbnailUrl(t); return `<div class="trip-card-banner${tu ? " has-thumb" : ""}">
        ${tu ? `<img src="${escapeAttr(tu)}" alt="${escapeHtml(t.title)}" loading="lazy" decoding="async" onerror="this.parentElement.classList.remove('has-thumb');this.remove()" />` : (t.emoji || "🌍")}
      </div>`; })()}
      <div class="trip-card-title">${escapeHtml(t.title)}</div>
      <div class="trip-card-dest">${escapeHtml(t.destination || "Destination TBD")}</div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${dates}${nights ? ` <span class="muted">· ${nights}d</span>` : ""}
      </div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        ${peopleCt ? peopleCt + " " + (peopleCt === 1 ? "traveler" : "travelers") : "Solo or TBD"}
      </div>
      <div class="trip-card-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        ${totalSpend > 0 ? fmtCurrency(totalSpend) : (t.budget ? fmtCurrency(t.budget) + "/person budget" : "No expenses yet")}
      </div>
      <button class="btn sm edit-action" style="margin-top:10px;width:100%;justify-content:center;"
              onclick="duplicateTrip('${t.id}', event)" title="Duplicate as template">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Duplicate
      </button>
    </div>
  `;
}

function getTripMemoryLine(t) {
  const line = (t.memoryLine || "").trim();
  if (line) return line;
  return (t.destination || "").trim() || "Memory";
}

function renderPostcard(t, idx) {
  const dates = (t.startDate || t.endDate)
    ? `${fmtDate(t.startDate, {month:"short",day:"numeric"})}${t.endDate ? " – " + fmtDate(t.endDate, {month:"short",day:"numeric",year:"numeric"}) : ""}`
    : "Dates TBD";
  const peopleCt = (t.travelers || []).length;
  const totalSpend = (t.expenses || []).reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const nights = tripDuration(t);
  const memoryLine = getTripMemoryLine(t);
  return `
    <article class="postcard" data-trip-id="${escapeAttr(t.id)}" onclick="handlePostcardClick(event, '${t.id}')">
      <div class="stamp">${(t.startDate || "").slice(0,4) || ""}</div>
      <div class="postcard-emoji">${t.emoji || "🌍"}</div>
      <div class="postcard-title">${escapeHtml(t.title)}</div>
      <div class="postcard-sub">${escapeHtml(dates)}</div>
      <div class="postcard-memory">${escapeHtml(memoryLine)}</div>

      <div class="postcard-reveal">
        <div class="text-sm">${peopleCt ? peopleCt + " traveler" + (peopleCt === 1 ? "" : "s") : "Travelers TBD"} · ${nights ? nights + " day" + (nights === 1 ? "" : "s") : "Dates TBD"}</div>
        <div class="text-sm" style="margin-top:4px;">${totalSpend > 0 ? fmtCurrency(totalSpend) + " total" : (t.budget ? fmtCurrency(t.budget) + "/person budget" : "No expenses yet")}</div>
        <div class="postcard-actions">
          <button class="btn sm" onclick="openTrip('${t.id}'); event.stopPropagation();">Open trip</button>
          <button class="postcard-edit" onclick="openMemoryLineEditor('${t.id}'); event.stopPropagation();">✎ Memory</button>
        </div>
      </div>
    </article>
  `;
}

function setupPastYearScrubber() {
  const track = document.getElementById("year-track");
  const handle = document.getElementById("year-handle");
  const tooltip = document.getElementById("year-tooltip");
  if (!track || !handle) return;
  const points = Array.from(track.querySelectorAll(".year-node"));
  if (!points.length) return;

  const resolveActive = () => {
    if (pastYearFilter === "all") return points[points.length - 1];
    return points.find(p => p.dataset.year === pastYearFilter) || points[points.length - 1];
  };

  const positionHandle = (point, showTooltip) => {
    if (!point) return;
    const trackRect = track.getBoundingClientRect();
    const pointRect = point.getBoundingClientRect();
    const center = pointRect.left - trackRect.left + pointRect.width / 2;
    handle.style.left = `${center}px`;
    if (tooltip) {
      tooltip.textContent = point.dataset.year || "";
      tooltip.style.display = showTooltip ? "block" : "none";
    }
  };

  const pickNearestYear = (clientX) => {
    const trackRect = track.getBoundingClientRect();
    const x = Math.min(Math.max(clientX, trackRect.left), trackRect.right);
    let nearest = points[0];
    let min = Infinity;
    points.forEach(p => {
      const r = p.getBoundingClientRect();
      const px = r.left + r.width / 2;
      const d = Math.abs(px - x);
      if (d < min) { min = d; nearest = p; }
    });
    return nearest;
  };

  positionHandle(resolveActive(), false);

  let dragging = false;
  let pendingYear = null;
  const onPointerMove = (e) => {
    if (!dragging) return;
    const nearest = pickNearestYear(e.clientX);
    pendingYear = nearest.dataset.year;
    positionHandle(nearest, true);
  };

  const stopDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { handle.releasePointerCapture(e.pointerId); } catch {}
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", stopDrag);
    if (pendingYear && pastYearFilter !== pendingYear) {
      setPastYearFilter(pendingYear);
    } else {
      positionHandle(resolveActive(), false);
    }
    pendingYear = null;
  };

  handle.onpointerdown = (e) => {
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", stopDrag);
  };

  track.onpointerdown = (e) => {
    if (e.target === handle) return;
    const nearest = pickNearestYear(e.clientX);
    pendingYear = nearest.dataset.year;
    positionHandle(nearest, true);
    if (pendingYear && pastYearFilter !== pendingYear) {
      setPastYearFilter(pendingYear);
    } else {
      positionHandle(resolveActive(), false);
    }
    pendingYear = null;
  };
}

function handlePostcardClick(event, tripId) {
  const card = event.currentTarget;
  if (event.target.closest(".postcard-actions") || event.target.closest(".postcard-edit")) return;
  if (card.classList.contains("revealed")) {
    openTrip(tripId);
    return;
  }
  document.querySelectorAll(".postcard.revealed").forEach(c => c.classList.remove("revealed"));
  card.classList.add("revealed");
}

function openMemoryLineEditor(tripId) {
  if (!guardEdit()) return;
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t) return;
  const current = (t.memoryLine || "").trim();
  showModal({
    title: "Edit memory line",
    size: "sm",
    body: `
      <div class="field">
        <label>Memory line</label>
        <input id="memory-line-input" value="${escapeAttr(current)}" placeholder="${escapeAttr(t.destination || 'Memory line')}" />
      </div>
    `,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Save", primary: true, onClick: () => {
        const v = (document.getElementById("memory-line-input").value || "").trim();
        t.memoryLine = v;
        saveState();
        closeModal();
        const card = document.querySelector(`.postcard[data-trip-id="${tripId}"]`);
        if (card) {
          const mem = card.querySelector(".postcard-memory");
          if (mem) mem.textContent = v || (t.destination || "").trim() || "Memory";
        } else {
          homePanelRender();
        }
      }}
    ]
  });
}

Object.assign(window, {
  getOnThisDayTrips, renderOnThisDay,
  renderHome, renderHomeUpcoming, renderHomePast, homePanelRender, loadMoreUpcoming,
  getFileThumbUrl, getTripThumbnailUrl, renderTripCard, getTripMemoryLine, renderPostcard,
  setupPastYearScrubber, handlePostcardClick, openMemoryLineEditor,
});

