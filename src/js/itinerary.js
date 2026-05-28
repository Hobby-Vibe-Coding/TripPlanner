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


const TIME_SLOTS_DEFAULT = [
  "7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
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
  const activities = [];
  const covered = new Set();
  slots.forEach((time, sIdx) => {
    if (covered.has(sIdx)) return;
    const slot = day.slots[sIdx];
    if (!slot || !slot.activity?.trim()) return;
    const span = Math.min(slot.span || 1, slots.length - sIdx);
    for (let k = 1; k < span; k++) covered.add(sIdx + k);
    const timeLabel = span > 1 ? `${time} – ${slotEndLabel(slots, sIdx + span)}` : time;
    activities.push({ time: timeLabel, activity: slot.activity, address: slot.address });
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

function renderItinerary(t) {
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const startDate = parseDate(t.startDate);
  const isMobile = window.innerWidth <= 600;

  // Clamp mobile day index
  itinMobileDay = Math.max(0, Math.min(t.itinerary.length - 1, itinMobileDay));

  // On mobile show one day at a time; on desktop show all
  const displayDayIndices = isMobile ? [itinMobileDay] : t.itinerary.map((_, i) => i);
  const displayDayCount = displayDayIndices.length;

  const gridStyle = `grid-template-columns: 80px repeat(${displayDayCount}, minmax(160px, 1fr)); grid-template-rows: auto repeat(${slots.length}, minmax(46px, auto));`;

  let cells = "";

  // Header row (grid row 1)
  cells += `<div class="itin-cell time itin-time-hdr" style="grid-row:1; grid-column:1;">Time</div>`;
  displayDayIndices.forEach((dIdx, colPos) => {
    const d = t.itinerary[dIdx];
    let dayDate = "";
    if (startDate) { const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx); dayDate = dd.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" }); }
    cells += `
      <div class="itin-cell daycol" style="grid-row:1; grid-column:${colPos+2};">
        <div class="dnum">Day ${dIdx+1}</div>
        ${dayDate ? `<div class="ddate">${dayDate}</div>`:""}
        <input class="theme-in" value="${escapeHtml(d.theme||"")}" placeholder="Day theme..." onchange="updateDayTheme(${dIdx}, this.value)" />
      </div>`;
  });

  // Slot rows: for each displayed day
  displayDayIndices.forEach((dIdx, colPos) => {
    const d = t.itinerary[dIdx];
    const covered = new Set();
    slots.forEach((time, sIdx) => {
      if (covered.has(sIdx)) return;
      if (!d.slots[sIdx]) d.slots[sIdx] = { time, activity: "" };
      const slot = d.slots[sIdx];
      const v = slot.activity || "";
      const isFilled = !!(v || slot.filled);
      const span = Math.min(slot.span || 1, slots.length - sIdx);
      for (let k = 1; k < span; k++) covered.add(sIdx + k);

      const gridRow = span > 1 ? `grid-row: ${sIdx+2} / span ${span}` : `grid-row: ${sIdx+2}`;
      const gridCol = `grid-column: ${colPos+2}`;
      // Exclusive end label — matches what openActivityTimeDialog shows
      const spanLabel = v ? (span > 1 ? `${slots[sIdx]} – ${slotEndLabel(slots, sIdx + span)}` : slots[sIdx]) : '';

      const linkedResId = slot.reservationId || "";
      const linkedRes = linkedResId ? (t.reservations || []).find(r => r.id === linkedResId) : null;
      const resBadge = linkedRes ? `
        <div class="slot-res-badge ${linkedRes.status || 'pending'}">
          ${linkedRes.status === 'booked' ? '✓' : linkedRes.status === 'cancelled' ? '✗' : '⏳'}
          ${escapeHtml(linkedRes.name)}
        </div>` : '';
      const resLinkBtn = v && isEditing() ? `
        <button class="slot-res-link-btn ${linkedRes ? 'linked' : ''}"
                onclick="openResLinkPicker(${dIdx},${sIdx})" title="${linkedRes ? 'Change reservation link' : 'Link reservation'}">
          🔗
        </button>` : '';

      const addr = slot.address || '';
      const mapsUrl = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '';
      const addrInput = v && isEditing() && !addr ? `
        <input class="slot-addr-input" value="" placeholder="📍 Add address..."
               onchange="updateSlotField(${dIdx},${sIdx},'address',this.value)"
               onclick="event.stopPropagation()" />` : '';
      const addrLink = v && addr ? `
        <div class="slot-addr-row">
          <a class="slot-addr-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(addr)}
          </a>
          ${isEditing() ? `<button class="slot-addr-clear" onclick="event.stopPropagation();updateSlotField(${dIdx},${sIdx},'address','')" title="Remove address">✕</button>` : ''}
        </div>` : '';
      const deleteBtn = isFilled && isEditing() ? `
        <button class="slot-delete-btn" onclick="event.stopPropagation();deleteSlot(${dIdx},${sIdx})" title="Remove activity">✕</button>` : '';

      cells += `<div class="itin-cell slot ${isFilled?"filled":""}" style="${gridRow}; ${gridCol};"
                     data-didx="${dIdx}" data-sidx="${sIdx}" data-span="${span}">
        <div class="slot-content">
          ${spanLabel ? `<div class="slot-time-badge">${spanLabel}</div>` : ''}
          <textarea class="autogrow" onchange="updateSlot(${dIdx}, ${sIdx}, this.value)" placeholder="${isFilled && !v ? 'Enter activity...' : ''}">${escapeHtml(v)}</textarea>
          ${addrInput}
          ${addrLink}
          ${resBadge}
        </div>
        ${v ? `<div class="drag-handle" onmousedown="startSlotDrag(event, ${dIdx}, ${sIdx})"></div>` : ''}
        ${isFilled ? `<div class="slot-btns">${v ? `<button class="mobile-edit-btn" onclick="openActivityTimeDialog(${dIdx}, ${sIdx})" title="Edit time">⏱</button>` : ''}${resLinkBtn}${deleteBtn}</div>` : ''}
      </div>`;
    });
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
      <div class="panel-sub no-print">Tap any cell to add an activity. Drag the bottom edge to span multiple hours. On mobile, tap ⏱ to set duration.</div>
      ${mobileNav}
      <div class="itin-grid-wrap">
        <div class="itin-grid" style="${gridStyle}">
          ${cells}
        </div>
      </div>
    </div>
  `;
}

function openResLinkPicker(dIdx, sIdx) {
  const t = currentTrip();
  const slot = t.itinerary[dIdx]?.slots[sIdx];
  if (!slot) return;
  const reservations = (t.reservations || []).filter(r => r.name?.trim());
  const currentId = slot.reservationId || "";

  // Compute which date this day corresponds to for auto-highlight
  const startDate = parseDate(t.startDate);
  let dayDateStr = "";
  if (startDate) { const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx); dayDateStr = dd.toISOString().slice(0, 10); }

  const STATUS_ICON = { booked: "✓", pending: "⏳", cancelled: "✗" };

  showModal({
    title: "Link reservation",
    size: "sm",
    body: `
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
        Choose a reservation to link to <strong>${escapeHtml(slot.activity)}</strong>.
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
                     style="accent-color:var(--primary);" onchange="linkSlotReservation(${dIdx},${sIdx},'${r.id}')" />
              <span style="flex:1;font-size:13px;font-weight:600;">${escapeHtml(r.name)}</span>
              <span class="slot-res-badge ${r.status||'pending'}" style="pointer-events:none;">
                ${STATUS_ICON[r.status] || '⏳'} ${r.status || 'pending'}
              </span>
              ${matchesDay && !isLinked ? `<span style="font-size:10px;color:var(--primary);">same day</span>` : ''}
            </label>`;
        }).join("") : `<p class="muted text-sm">No named reservations yet. Add some in the Reservations tab.</p>`}
      </div>
      ${currentId ? `<button class="btn sm ghost" style="margin-top:12px;color:#c0392b;"
                             onclick="linkSlotReservation(${dIdx},${sIdx},'')">✕ Remove link</button>` : ""}
    `,
    actions: [{ label: "Done", primary: true, onClick: () => { closeModal(); render(); } }],
  });
}

function linkSlotReservation(dIdx, sIdx, resId) {
  const t = currentTrip();
  if (!t.itinerary[dIdx]?.slots[sIdx]) return;
  t.itinerary[dIdx].slots[sIdx].reservationId = resId || undefined;
  saveState();
}
function updateSlotField(dIdx, sIdx, field, value) {
  if (!guardEdit()) return;
  const t = currentTrip();
  if (!t.itinerary[dIdx]?.slots[sIdx]) return;
  t.itinerary[dIdx].slots[sIdx][field] = value || undefined;
  saveState();
  // Re-render only to update the address link (no full re-render needed for just saving)
  // But we need the link to appear/disappear, so re-render the itinerary cell
  render();
}

function updateDayTheme(i, v) {
  if (!guardEdit()) return;
  const t = currentTrip(); t.itinerary[i].theme = v; saveState();
}
function updateSlot(dIdx, sIdx, v) {
  if (!guardEdit()) return;
  const t = currentTrip();
  if (!t.itinerary[dIdx].slots[sIdx]) t.itinerary[dIdx].slots[sIdx] = { time: (t.timeSlots||TIME_SLOTS_DEFAULT)[sIdx], activity: "" };
  const slot = t.itinerary[dIdx].slots[sIdx];
  const hasActivity = !!(v && v.trim());
  slot.activity = v;
  slot.filled = hasActivity;
  if (!hasActivity) slot.span = 1;
  saveState();
  render();
}
function deleteSlot(dIdx, sIdx) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const slot = t.itinerary[dIdx]?.slots[sIdx];
  if (!slot) return;
  const label = slot.activity?.trim() ? `"${slot.activity.trim().substring(0, 40)}"` : "this activity";
  showModal({
    title: "Remove activity",
    size: "sm",
    body: `<p style="margin:0;font-size:14px;">Remove ${label} from the itinerary? This cannot be undone.</p>`,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Remove", danger: true, onClick: () => {
        slot.activity = "";
        slot.filled = false;
        slot.span = 1;
        delete slot.address;
        delete slot.reservationId;
        saveState();
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

  // Detect interval from current slots
  let detectedInterval = 60;
  if (current.length >= 2) {
    const a = parseTime12(current[0]), b = parseTime12(current[1]);
    if (a !== null && b !== null && b > a) detectedInterval = b - a;
  }

  const halfHours = allHalfHourTimes();
  const timeOpts = (sel) => halfHours.map(h => `<option${h===sel?" selected":""}>${h}</option>`).join("");

  function buildPreview() {
    const start = document.getElementById('tse-start')?.value || firstSlot;
    const last = document.getElementById('tse-last')?.value || lastSlot;
    const iv = parseInt(document.getElementById('tse-interval')?.value || 60);
    const gen = generateSlotsFromRange(start, last, iv);
    const el = document.getElementById('tse-preview');
    if (el) el.textContent = gen.length
      ? `${gen.length} slots: ${gen[0]} → ${gen[gen.length-1]}`
      : 'No slots — check start/end times';
  }

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
        const last = document.getElementById('tse-last').value;
        const iv = parseInt(document.getElementById('tse-interval').value);
        const slots = generateSlotsFromRange(start, last, iv);
        if (!slots.length) return alert("No slots generated — make sure first slot is before last slot.");
        t.timeSlots = slots;
        t.itinerary.forEach(d => {
          const oldMap = {};
          (d.slots||[]).forEach(s => { oldMap[s.time] = { activity: s.activity, span: s.span, filled: s.filled }; });
          d.slots = slots.map(time => ({ time, activity: (oldMap[time]||{}).activity || "", span: (oldMap[time]||{}).span || 1, ...(oldMap[time]?.filled ? { filled: true } : {}) }));
        });
        saveState(); closeModal(); render();
      }}
    ]
  });
}

// -------- DRAG TO RESIZE ACTIVITY SPAN --------
let dragState = null;

function startSlotDrag(e, dIdx, sIdx) {
  if (!isEditing()) return;
  e.preventDefault();
  const t = currentTrip();
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const cell = e.target.closest('.itin-cell.slot');
  if (!cell) return;

  // Get all slot cells for this day to compute row positions
  const grid = cell.closest('.itin-grid');
  const allTimeCells = grid.querySelectorAll('.itin-cell.time:not(.daycol)');
  // Build row boundaries from the time cells (column 1)
  // Actually use all cells in column 1 that are slot rows
  const timeCellArr = [];
  allTimeCells.forEach(tc => {
    // skip the header "Time" cell
    if (tc.style.gridRow && parseInt(tc.style.gridRow) >= 2) {
      timeCellArr.push(tc);
    }
  });

  const rowBounds = timeCellArr.map(tc => {
    const r = tc.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, mid: r.top + r.height/2 };
  });

  const startSpan = t.itinerary[dIdx].slots[sIdx].span || 1;

  dragState = { dIdx, sIdx, startSpan, rowBounds, maxSpan: slots.length - sIdx };

  const onMove = (ev) => {
    if (!dragState) return;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    // Find which row the mouse is over
    let newSpan = 1;
    for (let i = sIdx; i < dragState.rowBounds.length; i++) {
      if (clientY >= dragState.rowBounds[i].mid) {
        newSpan = i - sIdx + 1;
      }
    }
    newSpan = Math.max(1, Math.min(newSpan, dragState.maxSpan));

    // Check if any covered slot has content (don't merge over filled slots)
    const day = t.itinerary[dIdx];
    let canSpan = true;
    for (let k = 1; k < newSpan; k++) {
      const coveredSlot = day.slots[sIdx + k];
      if (coveredSlot && (coveredSlot.filled || (coveredSlot.activity && coveredSlot.activity.trim()))) {
        newSpan = k; // stop before the filled slot
        break;
      }
    }

    if (newSpan !== (t.itinerary[dIdx].slots[sIdx].span || 1)) {
      t.itinerary[dIdx].slots[sIdx].span = newSpan;
      // Clear span on covered slots
      for (let k = 1; k < newSpan; k++) {
        if (day.slots[sIdx + k]) day.slots[sIdx + k].span = 1;
      }
      // Update cell visually without full re-render during drag
      cell.style.gridRow = `${sIdx+2} / span ${newSpan}`;
    }
  };

  const onUp = () => {
    dragState = null;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    saveState(); render(); // full re-render on drag end
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

// -------- MOBILE ACTIVITY TIME DIALOG --------
function openActivityTimeDialog(dIdx, sIdx) {
  const t = currentTrip(); if (!t) return;
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const day = t.itinerary[dIdx];
  const slot = day.slots[sIdx];
  const currentSpan = slot.span || 1;
  const startDate = parseDate(t.startDate);
  let dayLabel = `Day ${dIdx+1}`;
  if (startDate) {
    const dd = new Date(startDate); dd.setDate(dd.getDate() + dIdx);
    dayLabel = dd.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
  }

  // Build start time options (current start slot)
  const startOptions = slots.map((s, i) =>
    `<option value="${i}" ${i===sIdx?"selected":""}>${s}</option>`
  ).join("");

  // Build end time options — exclusive end (matches what the calendar displays: "7AM – 11AM")
  // currentEndIdx = sIdx + span (first slot AFTER the event, same as the display)
  const currentEndIdx = sIdx + currentSpan;
  const endOpts = [];
  for (let i = sIdx + 1; i <= slots.length; i++) {
    let blocked = false;
    for (let k = sIdx + 1; k < i; k++) {
      if (day.slots[k] && day.slots[k].activity && day.slots[k].activity.trim()) { blocked = true; break; }
    }
    if (blocked) break;
    const label = slotEndLabel(slots, i);
    endOpts.push(`<option value="${i}" ${i===currentEndIdx?"selected":""}>${label}</option>`);
  }
  const endOptions = endOpts.join("");

  showModal({
    title: `${escapeHtml(slot.activity || "Activity")}`,
    size: "sm",
    body: `
      <div class="activity-time-form">
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:4px;">${dayLabel}</div>
        <div class="field">
          <label>Activity</label>
          <textarea id="atd-activity" rows="2" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:14px;">${escapeHtml(slot.activity||"")}</textarea>
        </div>
        <div class="field-row">
          <label>Start</label>
          <select id="atd-start">${startOptions}</select>
        </div>
        <div class="field-row">
          <label>End</label>
          <select id="atd-end">${endOptions}</select>
        </div>
      </div>
    `,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Save", primary: true, onClick: () => {
        const newActivity = document.getElementById("atd-activity").value;
        const newStart = parseInt(document.getElementById("atd-start").value);
        const newEnd = parseInt(document.getElementById("atd-end").value);
        // newEnd is exclusive (same as display), so span = newEnd - newStart
        const newSpan = Math.max(1, newEnd - newStart);

        // If start changed, move the activity
        if (newStart !== sIdx) {
          // Clear old slot
          day.slots[sIdx].activity = "";
          day.slots[sIdx].span = 1;
          // Set new slot
          if (!day.slots[newStart]) day.slots[newStart] = { time: slots[newStart], activity: "" };
          day.slots[newStart].activity = newActivity;
          day.slots[newStart].span = newSpan;
        } else {
          day.slots[sIdx].activity = newActivity;
          day.slots[sIdx].span = newSpan;
        }

        saveState(); closeModal(); render();
      }}
    ]
  });
}

Object.assign(window, {
  renderItinerary,
  navItinDay, showDaySummary, openTimeSlotsEditor, openResLinkPicker,
  linkSlotReservation, updateSlotField, updateDayTheme, updateSlot, deleteSlot,
  startSlotDrag, openActivityTimeDialog,
});

