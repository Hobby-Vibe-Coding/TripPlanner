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
const isEditing   = () => window.isEditing();
const isShareMode = () => window.isShareMode();


const TIME_SLOTS_DEFAULT = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM",
  "7:00 PM","8:00 PM","9:00 PM","10:00 PM","11:00 PM"
];

let itinMobileDay = 0;
// Live getter/setter — Object.assign would copy only the initial number (always 0).
Object.defineProperty(window, 'itinMobileDay', {
  get() { return itinMobileDay; },
  set(v) { itinMobileDay = v; },
  configurable: true,
});

// -------- ITINERARY TAB --------

function navItinDay(delta) {
  const t = currentTrip(); if (!t) return;
  itinMobileDay = Math.max(0, Math.min(t.itinerary.length - 1, itinMobileDay + delta));
  render();
}

function showDaySummary() {
  const t = currentTrip(); if (!t) return;
  const dIdx = Math.max(0, Math.min(t.itinerary.length - 1, itinMobileDay));
  const day = t.itinerary[dIdx];
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const startDate = parseDate(t.startDate);
  let dayLabel = `Day ${dIdx + 1}`;
  if (startDate) {
    const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx);
    dayLabel = dd.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  const activities = (day.events || [])
    .filter(ev => ev.activity?.trim())
    .sort((a, b) => a.startSlot - b.startSlot)
    .map(ev => {
      const timeLabel = (ev.span || 1) > 1
        ? `${slots[ev.startSlot] || ''} – ${slotEndLabel(slots, ev.startSlot + ev.span)}`
        : (slots[ev.startSlot] || '');
      return { time: timeLabel, activity: ev.activity, address: ev.address };
    });
  const content = activities.length
    ? activities.map(a => `
        <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);">
          <div style="min-width:100px;font-size:11px;color:var(--ink-soft);font-weight:600;font-variant-numeric:tabular-nums;padding-top:2px;">${a.time}</div>
          <div>
            <div style="font-size:14px;font-weight:600;">${escapeHtml(a.activity)}</div>
            ${a.address ? `<div style="font-size:11px;color:var(--ink-soft);margin-top:3px;">📍 ${escapeHtml(a.address)}</div>` : ''}
          </div>
        </div>`).join('')
    : `<p style="color:var(--ink-soft);text-align:center;padding:24px 0;">No activities planned for this day yet.</p>`;
  const theme = day.theme ? ` · ${day.theme}` : '';
  showModal({
    title: `${escapeHtml(dayLabel)}${escapeHtml(theme)}`,
    body: `<div style="max-height:65vh;overflow-y:auto;">${content}</div>`,
    actions: [{ label: 'Close', primary: true, onClick: closeModal }],
  });
}

// Assign column positions to overlapping events (mutates ev._col). Returns maxCols.
function computeOverlapLayout(events) {
  const sorted = [...events].sort((a, b) => a.startSlot - b.startSlot || (a.id < b.id ? -1 : 1));
  const tracks = []; // endSlot of last event in each track
  for (const ev of sorted) {
    const track = tracks.findIndex(end => end <= ev.startSlot);
    if (track === -1) {
      ev._col = tracks.length;
      tracks.push(ev.startSlot + (ev.span || 1));
    } else {
      ev._col = track;
      tracks[track] = ev.startSlot + (ev.span || 1);
    }
  }
  return tracks.length || 1;
}

function renderItinerary(t) {
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const N = slots.length;
  const startDate = parseDate(t.startDate);
  const isMobile = window.innerWidth <= 600;
  const editing = isEditing();

  // Clamp mobile day index
  itinMobileDay = Math.max(0, Math.min(t.itinerary.length - 1, itinMobileDay));

  const displayDayIndices = isMobile ? [itinMobileDay] : t.itinerary.map((_, i) => i);
  const displayDayCount = displayDayIndices.length;

  const gridStyle = `--slot-h: 46px; --event-gap: 4px; grid-template-columns: 80px repeat(${displayDayCount}, minmax(160px, 1fr)); grid-template-rows: auto repeat(${N}, var(--slot-h));`;

  let cells = "";

  // Header row (grid row 1)
  cells += `<div class="itin-cell time itin-time-hdr" style="grid-row:1; grid-column:1;">Time</div>`;
  displayDayIndices.forEach((dIdx, colPos) => {
    const d = t.itinerary[dIdx];
    let dayDate = "";
    if (startDate) { const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx); dayDate = dd.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" }); }
    const dayNum = dIdx + 1;
    const travSched = t.travelerSchedule || {};
    const joins = Object.entries(travSched).filter(([, s]) => s.joinDay === dayNum).map(([n]) => n);
    const leaves = Object.entries(travSched).filter(([, s]) => s.leaveDay === dayNum).map(([n]) => n);
    const schedHtml = [
      ...joins.map(n => `<div class="itin-trav-sched join">👋 ${escapeHtml(n)}</div>`),
      ...leaves.map(n => `<div class="itin-trav-sched leave">${escapeHtml(n)} ↗</div>`)
    ].join('');
    cells += `
      <div class="itin-cell daycol" style="grid-row:1; grid-column:${colPos+2};">
        <div class="dnum">Day ${dIdx+1}</div>
        ${dayDate ? `<div class="ddate">${dayDate}</div>`:""}
        ${schedHtml}
        <input class="theme-in" value="${escapeHtml(d.theme||"")}" placeholder="Day theme..." onchange="updateDayTheme(${dIdx}, this.value)" />
      </div>`;
  });

  // Day column containers — one per displayed day, spanning all slot rows
  displayDayIndices.forEach((dIdx, colPos) => {
    const d = t.itinerary[dIdx];
    const dayEvents = d.events || [];

    // Compute overlap columns for filled events
    dayEvents.forEach(ev => { ev._col = undefined; });
    const filledEvents = dayEvents.filter(ev => ev.activity?.trim());
    const maxCols = computeOverlapLayout(filledEvents);

    let dayColHtml = '';

    // Slot bands: transparent click targets, one per time slot
    slots.forEach((time, sIdx) => {
      dayColHtml += `<div class="itin-slot-band"
           style="top:calc(${sIdx}*var(--slot-h));height:var(--slot-h);"
           data-didx="${dIdx}" data-sidx="${sIdx}"
           ${editing ? `onclick="createEventAt(${dIdx},${sIdx})"` : ''}></div>`;
    });

    // Events (filled + newly created unfilled ones)
    dayEvents.forEach(ev => {
      const v = ev.activity || '';
      const isFilled = !!(v || ev.filled);
      const startSlot = Math.max(0, Math.min(ev.startSlot || 0, N - 1));
      const span      = Math.max(1, Math.min(ev.span || 1, N - startSlot));
      const col       = ev._col ?? 0;
      const mCols     = (ev._col != null) ? maxCols : 1;
      const leftPct   = (col / mCols * 100).toFixed(2);
      const widthPct  = (100 / mCols).toFixed(2);

      const spanLabel = v ? (span > 1
        ? `${slots[startSlot] || ''} – ${slotEndLabel(slots, startSlot + span)}`
        : (slots[startSlot] || '')) : '';

      const linkedResId = ev.reservationId || "";
      const linkedRes = linkedResId ? (t.reservations || []).find(r => r.id === linkedResId) : null;
      const resBadge = linkedRes ? `
        <div class="slot-res-badge ${linkedRes.status || 'pending'}">
          ${linkedRes.status === 'booked' ? '✓' : linkedRes.status === 'cancelled' ? '✗' : '⏳'}
          ${escapeHtml(linkedRes.name)}
        </div>` : '';

      const resLinkBtn = isFilled && editing ? `
        <button class="slot-res-link-btn ${linkedRes ? 'linked' : ''}"
                onclick="event.stopPropagation();openResLinkPicker(${dIdx},'${ev.id}')"
                title="${linkedRes ? 'Change reservation link' : 'Link reservation'}">🔗</button>` : '';

      const addr = ev.address || '';
      const mapsUrl = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '';
      const addrInput = v && editing && !addr ? `
        <input class="slot-addr-input" value="" placeholder="📍 Add address..."
               onchange="updateEventField(${dIdx},'${ev.id}','address',this.value)"
               onclick="event.stopPropagation()" />` : '';
      const addrLink = v && addr ? `
        <div class="slot-addr-row">
          <a class="slot-addr-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(addr)}
          </a>
          ${editing ? `<button class="slot-addr-clear" onclick="event.stopPropagation();updateEventField(${dIdx},'${ev.id}','address','')" title="Remove address">✕</button>` : ''}
        </div>` : '';

      const mobileEditBtn = v ? `<button class="mobile-edit-btn" onclick="openEventDialog(${dIdx},'${ev.id}')" title="Edit time">⏱</button>` : '';
      const moveBtn       = v && editing ? `<button class="move-handle-btn" onmousedown="event.stopPropagation();startEventMove(event,${dIdx},'${ev.id}')" title="Move event">⠿</button>` : '';
      const deleteBtn     = isFilled && editing ? `<button class="slot-delete-btn" onclick="event.stopPropagation();deleteEvent(${dIdx},'${ev.id}')" title="Remove activity">✕</button>` : '';

      dayColHtml += `
           <div class="itin-event ${isFilled ? 'filled' : ''}"
             style="top:calc(${startSlot}*var(--slot-h) + var(--event-gap));height:calc(${span}*var(--slot-h) - (2 * var(--event-gap)) - 1px);left:calc(${leftPct}% + var(--event-gap));width:calc(${widthPct}% - (2 * var(--event-gap)));"
             data-didx="${dIdx}" data-eid="${ev.id}" data-sidx="${startSlot}" data-span="${span}">
          <div class="event-top-bar">
            <div class="slot-time-badge">${spanLabel}</div>
            ${isFilled ? `<div class="slot-btns">${mobileEditBtn}${moveBtn}${resLinkBtn}${deleteBtn}</div>` : ''}
          </div>
          <textarea class="event-textarea"
                    onchange="updateEventActivity(${dIdx},'${ev.id}',this.value)"
                    onblur="removeIfEmpty(${dIdx},'${ev.id}')"
                    placeholder="${isFilled && !v ? 'Enter activity...' : 'New activity...'}">${escapeHtml(v)}</textarea>
          ${addrInput}
          ${addrLink}
          ${resBadge}
          ${v && editing ? `<div class="event-resize-handle" onmousedown="event.stopPropagation();startEventResize(event,${dIdx},'${ev.id}')"></div>` : ''}
        </div>`;
    });

    cells += `<div class="itin-day-col"
                   style="grid-row:2/span ${N};grid-column:${colPos+2};"
                   data-didx="${dIdx}">
      ${dayColHtml}
    </div>`;
  });

  // Time labels (column 1)
  slots.forEach((time, sIdx) => {
    cells += `<div class="itin-cell time" style="grid-row:${sIdx+2}; grid-column:1;">${time}</div>`;
  });

  // Mobile day navigation bar
  let mobileNavDateLabel = "";
  if (startDate) { const dd = new Date(startDate); dd.setDate(dd.getDate() + itinMobileDay); mobileNavDateLabel = dd.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" }); }
  const mobileNav = `
    <div class="itin-day-nav">
      <button class="itin-day-nav-btn" onclick="navItinDay(-1)" ${itinMobileDay === 0 ? "disabled" : ""}>‹</button>
      <div class="itin-day-nav-center">
        <div class="itin-day-label">Day ${itinMobileDay+1} of ${t.itinerary.length}</div>
        ${mobileNavDateLabel ? `<div class="itin-day-date-label">${mobileNavDateLabel}</div>` : ''}
        <button class="itin-day-summary-btn" onclick="showDaySummary()">📋 Day summary</button>
      </div>
      <button class="itin-day-nav-btn" onclick="navItinDay(1)" ${itinMobileDay === t.itinerary.length - 1 ? "disabled" : ""}>›</button>
    </div>`;

  return `
    <div class="panel">
      <div class="panel-head">
        <h3>Day-by-day itinerary</h3>
        <div class="actions">
          <button class="btn sm" onclick="openTimeSlotsEditor()">⏱ Edit time slots</button>
        </div>
      </div>
      <div class="panel-sub no-print">Tap any cell to add an activity. Drag the bottom edge to resize. Drag ⠿ to move to a different time or day. On mobile, tap ⏱ to set time and date.</div>
      ${mobileNav}
      <div class="itin-grid-wrap">
        <div class="itin-grid" style="${gridStyle}">
          ${cells}
        </div>
      </div>
    </div>
  `;
}

function openResLinkPicker(dIdx, eventId) {
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const ev = day.events.find(e => e.id === eventId);
  if (!ev) return;
  const reservations = (t.reservations || []).filter(r => r.name?.trim());
  const currentId = ev.reservationId || "";

  const startDate = parseDate(t.startDate);
  let dayDateStr = "";
  if (startDate) { const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx); dayDateStr = dd.toISOString().slice(0, 10); }

  const STATUS_ICON = { booked: "✓", pending: "⏳", cancelled: "✗" };

  showModal({
    title: "Link reservation",
    size: "sm",
    body: `
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
        Choose a reservation to link to <strong>${escapeHtml(ev.activity)}</strong>.
      </p>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${reservations.length ? reservations.map(r => {
          const isLinked = r.id === currentId;
          const matchesDay = dayDateStr && r.dueDate?.startsWith(dayDateStr);
          return `
            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;cursor:pointer;
                          border:1.5px solid ${isLinked ? 'var(--primary)' : 'var(--line)'};
                          background:${isLinked ? 'var(--primary-soft)' : 'var(--surface-2)'};user-select:none;">
              <input type="radio" name="res-pick" value="${r.id}" ${isLinked ? 'checked' : ''}
                     style="accent-color:var(--primary);" onchange="linkEventReservation(${dIdx},'${eventId}','${r.id}')" />
              <span style="flex:1;font-size:13px;font-weight:600;">${escapeHtml(r.name)}</span>
              <span class="slot-res-badge ${r.status||'pending'}" style="pointer-events:none;">
                ${STATUS_ICON[r.status] || '⏳'} ${r.status || 'pending'}
              </span>
              ${matchesDay && !isLinked ? `<span style="font-size:10px;color:var(--primary);">same day</span>` : ''}
            </label>`;
        }).join("") : `<p class="muted text-sm">No named reservations yet. Add some in the Reservations tab.</p>`}
      </div>
      ${currentId ? `<button class="btn sm ghost" style="margin-top:12px;color:#c0392b;"
                             onclick="linkEventReservation(${dIdx},'${eventId}','')">✕ Remove link</button>` : ""}
    `,
    actions: [{ label: "Done", primary: true, onClick: () => { closeModal(); render(); } }],
  });
}

function linkEventReservation(dIdx, eventId, resId) {
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const ev = day.events.find(e => e.id === eventId);
  if (!ev) return;
  ev.reservationId = resId || undefined;
  mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
}

function updateEventField(dIdx, eventId, field, value) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const ev = day.events.find(e => e.id === eventId);
  if (!ev) return;
  ev[field] = value || undefined;
  mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
  render();
}

function updateDayTheme(i, v) {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.itinerary[i].theme = v;
  mutate({ type: 'updateDayTheme', tripId: t.id, dayId: t.itinerary[i].id, theme: v });
}

function updateEventActivity(dIdx, eventId, v) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const idx = day.events.findIndex(e => e.id === eventId);
  if (idx === -1) return;
  const ev = day.events[idx];
  const hasActivity = !!(v && v.trim());
  if (!hasActivity) {
    // Remove event if emptied
    day.events.splice(idx, 1);
    mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
    render();
    return;
  }
  ev.activity = v;
  ev.filled = true;
  mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
  render();
}

function createEventAt(dIdx, sIdx) {
  if (!isEditing()) return;
  if (!guardEdit()) return;
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const newId = uid();
  day.events = day.events || [];
  day.events.push({ id: newId, startSlot: sIdx, span: 1, activity: '', address: '', reservationId: null, filled: false });
  render();
  requestAnimationFrame(() => {
    const ta = document.querySelector(`[data-eid="${newId}"] .event-textarea`);
    if (ta) ta.focus();
  });
}

function deleteEvent(dIdx, eventId) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const idx = day.events.findIndex(e => e.id === eventId);
  if (idx === -1) return;
  const ev = day.events[idx];
  const label = ev.activity?.trim() ? `"${ev.activity.trim().substring(0, 40)}"` : "this activity";
  showModal({
    title: "Remove activity",
    size: "sm",
    body: `<p style="margin:0;font-size:14px;">Remove ${escapeHtml(label)} from the itinerary? This cannot be undone.</p>`,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Remove", danger: true, onClick: () => {
        day.events.splice(idx, 1);
        mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
        closeModal();
        render();
      }}
    ]
  });
}

function openTimeSlotsEditor() {
  if (!guardEdit()) return;
  const t = currentTrip();
  const current = t.timeSlots || TIME_SLOTS_DEFAULT;
  const firstSlot = current[0] || "7:00 AM";
  const lastSlot = current[current.length - 1] || "11:00 PM";

  let detectedInterval = 60;
  if (current.length >= 2) {
    const a = parseTime12(current[0]), b = parseTime12(current[1]);
    if (a !== null && b !== null && b > a) detectedInterval = b - a;
  }

  const halfHours = allHalfHourTimes();
  const timeOpts = (sel) => halfHours.map(h => `<option${h===sel?" selected":""}>${h}</option>`).join("");

  showModal({
    title: "Time slots",
    size: "sm",
    body: `
      <div class="activity-time-form">
        <p style="font-size:13px;color:var(--ink-soft);margin:0 0 4px;">Choose the time range and interval. All days share the same slots.</p>
        <div class="field-row">
          <label>First slot</label>
          <select id="tse-start" oninput="(function(){const a=allHalfHourTimes(),s=document.getElementById('tse-start').value,l=document.getElementById('tse-last').value;if(a.indexOf(l)<=a.indexOf(s)){const ni=Math.min(a.indexOf(s)+2,a.length-1);document.getElementById('tse-last').value=a[ni];}document.getElementById('tse-preview').textContent=''+(function(){const g=generateSlotsFromRange(s,document.getElementById('tse-last').value,parseInt(document.getElementById('tse-interval').value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';})();})()">
            ${timeOpts(firstSlot)}
          </select>
        </div>
        <div class="field-row">
          <label>Last slot</label>
          <select id="tse-last" oninput="document.getElementById('tse-preview').textContent=(function(){const g=generateSlotsFromRange(document.getElementById('tse-start').value,this.value,parseInt(document.getElementById('tse-interval').value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';}).call(this)">
            ${timeOpts(lastSlot)}
          </select>
        </div>
        <div class="field-row">
          <label>Interval</label>
          <select id="tse-interval" oninput="document.getElementById('tse-preview').textContent=(function(){const g=generateSlotsFromRange(document.getElementById('tse-start').value,document.getElementById('tse-last').value,parseInt(this.value));return g.length?g.length+' slots: '+g[0]+' → '+g[g.length-1]:'No slots';}).call(this)">
            <option value="30" ${detectedInterval===30?"selected":""}>Every 30 minutes</option>
            <option value="60" ${detectedInterval===60?"selected":""}>Every 1 hour</option>
            <option value="120" ${detectedInterval===120?"selected":""}>Every 2 hours</option>
          </select>
        </div>
        <div id="tse-preview" style="font-size:12px;color:var(--ink-soft);padding:6px 0;"></div>
      </div>
    `,
    onOpen: () => {
      const gen = generateSlotsFromRange(firstSlot, lastSlot, detectedInterval);
      const el = document.getElementById('tse-preview');
      if (el) el.textContent = gen.length ? `${gen.length} slots: ${gen[0]} → ${gen[gen.length-1]}` : 'No slots';
    },
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Save", primary: true, onClick: () => {
        const start = document.getElementById('tse-start').value;
        const last  = document.getElementById('tse-last').value;
        const iv    = parseInt(document.getElementById('tse-interval').value);
        const newSlots = generateSlotsFromRange(start, last, iv);
        if (!newSlots.length) return alert("No slots generated — make sure first slot is before last slot.");
        const oldSlots = t.timeSlots || TIME_SLOTS_DEFAULT;
        t.timeSlots = newSlots;
        t.itinerary.forEach(d => {
          d.events = (d.events || []).map(ev => {
            const timeLabel = oldSlots[ev.startSlot];
            const newStart  = timeLabel ? newSlots.indexOf(timeLabel) : -1;
            return { ...ev, startSlot: newStart >= 0 ? newStart : Math.min(ev.startSlot, newSlots.length - 1) };
          }).filter(ev => ev.startSlot >= 0 && ev.startSlot < newSlots.length);
        });
        mutate({ type: 'syncTimeSlots', tripId: t.id, timeSlots: t.timeSlots, days: t.itinerary });
        closeModal(); render();
      }}
    ]
  });
}

// -------- DRAG TO RESIZE EVENT SPAN --------
function startEventResize(e, dIdx, eventId) {
  if (!isEditing()) return;
  e.preventDefault();
  const t = currentTrip();
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const day = t.itinerary[dIdx];
  const ev = day.events.find(x => x.id === eventId);
  if (!ev) return;
  const sIdx = ev.startSlot;
  const eventEl = document.querySelector(`[data-eid="${eventId}"]`);
  if (!eventEl) return;

  // Build row boundaries from time label cells
  const grid = document.querySelector('.itin-grid');
  const timeCells = [...grid.querySelectorAll('.itin-cell.time')].filter(c => {
    const row = parseInt(c.style.gridRow);
    return !isNaN(row) && row >= 2;
  });
  const rowBounds = timeCells.map(tc => {
    const r = tc.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, mid: r.top + r.height / 2 };
  });

  const onMove = (ev2) => {
    const clientY = ev2.touches ? ev2.touches[0].clientY : ev2.clientY;
    let newSpan = 1;
    for (let i = sIdx; i < rowBounds.length; i++) {
      if (clientY >= rowBounds[i].mid) newSpan = i - sIdx + 1;
    }
    newSpan = Math.max(1, Math.min(newSpan, slots.length - sIdx));
    if (newSpan !== ev.span) {
      ev.span = newSpan;
      eventEl.style.height = `calc(${newSpan} * var(--slot-h) - (2 * var(--event-gap)) - 1px)`;
    }
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
    render();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

// -------- DRAG TO MOVE EVENT --------
function moveEventTo(fromDIdx, eventId, toDIdx, toSIdx) {
  const t = currentTrip();
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const fromDay = t.itinerary[fromDIdx];
  const toDay   = t.itinerary[toDIdx];
  const evIdx = fromDay.events.findIndex(e => e.id === eventId);
  if (evIdx === -1) return;
  const ev = fromDay.events[evIdx];

  const clampedStart = Math.max(0, Math.min(toSIdx, slots.length - 1));
  const clampedSpan  = Math.min(ev.span || 1, slots.length - clampedStart);

  if (fromDIdx === toDIdx) {
    ev.startSlot = clampedStart;
    ev.span = clampedSpan;
    mutate({ type: 'updateDaySlots', tripId: t.id, dayId: fromDay.id, events: fromDay.events });
  } else {
    fromDay.events.splice(evIdx, 1);
    ev.startSlot = clampedStart;
    ev.span = clampedSpan;
    toDay.events = toDay.events || [];
    toDay.events.push(ev);
    mutate({ type: 'updateDaySlots', tripId: t.id, dayId: fromDay.id, events: fromDay.events });
    mutate({ type: 'updateDaySlots', tripId: t.id, dayId: toDay.id,   events: toDay.events });
  }
  render();
}

function startEventMove(e, dIdx, eventId) {
  if (!isEditing()) return;
  e.preventDefault();
  e.stopPropagation();

  const t = currentTrip();
  const day = t.itinerary[dIdx];
  const ev = day.events.find(x => x.id === eventId);
  if (!ev) return;
  const span = ev.span || 1;

  const ghost = document.createElement('div');
  ghost.className = 'itin-drag-ghost';
  ghost.textContent = (ev.activity || '').slice(0, 60);
  ghost.style.left = '-300px';
  ghost.style.top  = '-300px';
  document.body.appendChild(ghost);

  let currentTarget = null;

  const getTarget = (x, y) => {
    ghost.style.visibility = 'hidden';
    const el = document.elementFromPoint(x, y);
    ghost.style.visibility = '';
    if (!el) return null;
    // Try slot band first
    const band = el.closest('.itin-slot-band');
    if (band) return { dIdx: parseInt(band.dataset.didx), sIdx: parseInt(band.dataset.sidx) };
    // Fall back to day column (calculate slot from Y)
    const dayCol = el.closest('.itin-day-col');
    if (dayCol) {
      const td  = parseInt(dayCol.dataset.didx);
      const rect = dayCol.getBoundingClientRect();
      const SLOT_H = 46;
      const ts = Math.max(0, Math.min(Math.floor((y - rect.top) / SLOT_H), (t.timeSlots || TIME_SLOTS_DEFAULT).length - 1));
      return { dIdx: td, sIdx: ts };
    }
    return null;
  };

  const clearHighlights = () => {
    document.querySelectorAll('.itin-slot-band.drop-highlight').forEach(c => c.classList.remove('drop-highlight'));
  };

  const highlightTarget = (td, ts) => {
    clearHighlights();
    const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
    if (ts + span > slots.length) return;
    const grid = document.querySelector('.itin-grid');
    if (!grid) return;
    for (let k = 0; k < span; k++) {
      const band = grid.querySelector(`.itin-slot-band[data-didx="${td}"][data-sidx="${ts + k}"]`);
      if (band) band.classList.add('drop-highlight');
    }
  };

  const onMove = (ev2) => {
    ev2.preventDefault();
    const x = ev2.touches ? ev2.touches[0].clientX : ev2.clientX;
    const y = ev2.touches ? ev2.touches[0].clientY : ev2.clientY;
    ghost.style.left = (x + 14) + 'px';
    ghost.style.top  = (y - 8)  + 'px';

    const target = getTarget(x, y);
    if (!target) { clearHighlights(); currentTarget = null; return; }
    if (!currentTarget || target.dIdx !== currentTarget.dIdx || target.sIdx !== currentTarget.sIdx) {
      currentTarget = target;
      highlightTarget(target.dIdx, target.sIdx);
    }
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    ghost.remove();
    clearHighlights();
    if (currentTarget && (currentTarget.dIdx !== dIdx || currentTarget.sIdx !== ev.startSlot)) {
      moveEventTo(dIdx, eventId, currentTarget.dIdx, currentTarget.sIdx);
    }
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

// -------- EVENT TIME / DATE DIALOG --------
function _atdRebuildEnd(newDayIdxStr, newStartStr) {
  const t = currentTrip(); if (!t) return;
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const ns = parseInt(newStartStr);
  const endSel = document.getElementById('atd-end'); if (!endSel) return;
  const curEnd = parseInt(endSel.value) || (ns + 1);
  const opts = [];
  for (let i = ns + 1; i <= slots.length; i++) {
    opts.push(`<option value="${i}" ${i === curEnd ? 'selected' : ''}>${slotEndLabel(slots, i)}</option>`);
  }
  endSel.innerHTML = opts.join('');
}

function openEventDialog(dIdx, eventId) {
  const t = currentTrip(); if (!t) return;
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const day = t.itinerary[dIdx];
  const ev = day.events.find(e => e.id === eventId);
  if (!ev) return;
  const startDate = parseDate(t.startDate);

  const dayOptions = t.itinerary.map((_, i) => {
    let label = `Day ${i + 1}`;
    if (startDate) {
      const dd = new Date(startDate); dd.setDate(dd.getDate() + i);
      label = dd.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }
    return `<option value="${i}" ${i === dIdx ? "selected" : ""}>${label}</option>`;
  }).join("");

  const startOptions = slots.map((s, i) =>
    `<option value="${i}" ${i === ev.startSlot ? "selected" : ""}>${s}</option>`
  ).join("");

  const currentEndIdx = ev.startSlot + (ev.span || 1);
  const endOptions = [];
  for (let i = ev.startSlot + 1; i <= slots.length; i++) {
    endOptions.push(`<option value="${i}" ${i === currentEndIdx ? "selected" : ""}>${slotEndLabel(slots, i)}</option>`);
  }

  showModal({
    title: escapeHtml(ev.activity || "Activity"),
    size: "sm",
    body: `
      <div class="activity-time-form">
        <div class="field">
          <label>Activity</label>
          <textarea id="atd-activity" rows="2" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:14px;">${escapeHtml(ev.activity || "")}</textarea>
        </div>
        <div class="field-row">
          <label>Day</label>
          <select id="atd-day" onchange="_atdRebuildEnd(this.value, document.getElementById('atd-start').value)">${dayOptions}</select>
        </div>
        <div class="field-row">
          <label>Start</label>
          <select id="atd-start" onchange="_atdRebuildEnd(document.getElementById('atd-day').value, this.value)">${startOptions}</select>
        </div>
        <div class="field-row">
          <label>End</label>
          <select id="atd-end">${endOptions.join('')}</select>
        </div>
      </div>
    `,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Save", primary: true, onClick: () => {
        const newActivity = document.getElementById("atd-activity").value;
        const newDayIdx   = parseInt(document.getElementById("atd-day").value);
        const newStart    = parseInt(document.getElementById("atd-start").value);
        const newEnd      = parseInt(document.getElementById("atd-end").value);
        if (newEnd <= newStart) {
          document.getElementById("atd-end").style.borderColor = "#c0392b";
          return;
        }
        const newSpan     = Math.max(1, newEnd - newStart);

        ev.activity  = newActivity;
        ev.startSlot = newStart;
        ev.span      = newSpan;
        ev.filled    = !!(newActivity?.trim());

        if (newDayIdx === dIdx) {
          mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id, events: day.events });
        } else {
          day.events = day.events.filter(e => e.id !== eventId);
          const toDay = t.itinerary[newDayIdx];
          toDay.events = toDay.events || [];
          toDay.events.push(ev);
          mutate({ type: 'updateDaySlots', tripId: t.id, dayId: day.id,   events: day.events });
          mutate({ type: 'updateDaySlots', tripId: t.id, dayId: toDay.id, events: toDay.events });
        }
        closeModal(); render();
      }}
    ]
  });
}

function removeIfEmpty(dIdx, eventId) {
  const t = currentTrip(); if (!t) return;
  const day = t.itinerary[dIdx];
  const idx = day.events.findIndex(e => e.id === eventId);
  if (idx === -1) return;
  const ev = day.events[idx];
  if (!ev.activity?.trim() && !ev.filled) {
    day.events.splice(idx, 1);
    render();
  }
}

Object.assign(window, {
  renderItinerary,
  navItinDay, showDaySummary, openTimeSlotsEditor, openResLinkPicker,
  linkEventReservation, updateEventField, updateDayTheme, updateEventActivity,
  createEventAt, deleteEvent, removeIfEmpty,
  startEventResize, startEventMove, moveEventTo,
  openEventDialog, _atdRebuildEnd,
  computeOverlapLayout,
});
