// Token storage — pure localStorage helpers, no state dependency
export function getToken() { return localStorage.getItem("tp_token"); }
export function setToken(t) { localStorage.setItem("tp_token", t); }

// -------- TIME SLOT HELPERS --------
function parseTime12(str) {
  const m = (str || "").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
function formatTime12(minutes) {
  const h24 = Math.floor(minutes / 60) % 24;
  const min = minutes % 60;
  const p = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2,'0')} ${p}`;
}
function nextTimeStr(timeStr) {
  const min = parseTime12(timeStr);
  if (min === null) return timeStr;
  return formatTime12(min + 60);
}
// Return the label for an exclusive-end slot index (slots[idx] or computed next time)
function slotEndLabel(slots, idx) {
  return idx < slots.length ? slots[idx] : nextTimeStr(slots[slots.length - 1]);
}
// Generate all half-hour time strings for the range picker dropdowns
function allHalfHourTimes() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) times.push(formatTime12(h * 60 + m));
  }
  return times;
}
// Generate slot array from inclusive start to inclusive last-slot end
function generateSlotsFromRange(startStr, lastStr, intervalMin) {
  const start = parseTime12(startStr);
  const last = parseTime12(lastStr);
  if (start === null || last === null || last < start) return [];
  const slots = [];
  for (let m = start; m <= last; m += intervalMin) slots.push(formatTime12(m));
  return slots;
}

const TIME_SLOTS_DEFAULT = [
  "7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM",
  "7:00 PM","8:00 PM","9:00 PM","10:00 PM","11:00 PM"
];

const EMOJI_OPTIONS = [
  "🏖️","🌴","🗽","🏔️","🌋","🏝️","🌆","🏰","🎢","🎡",
  "🗼","🏛️","⛩️","🛕","🌅","🌇","🏕️","⛺","🚣","🏄",
  "🎿","⛷️","🏂","🚗","✈️","🚂","🛳️","🏟️","🎭","🎨",
  "🍣","🍕","🍷","☕","🎪","🎰","🎢","🦘","🦒","🐠"
];

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

// -------- TIMEZONE --------
const TIMEZONES = [
  "America/Adak",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Juneau",
  "America/Metlakatla",
  "America/Nome",
  "America/Sitka",
  "America/Yakutat",
  "America/Los_Angeles",
  "America/Boise",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/Indiana/Knox",
  "America/Indiana/Tell_City",
  "America/Indiana/Indianapolis",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Detroit",
  "America/New_York",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Sao_Paulo","Atlantic/Reykjavik",
  "Europe/London","Europe/Paris","Europe/Berlin","Europe/Helsinki","Europe/Moscow",
  "Asia/Dubai","Asia/Kolkata","Asia/Bangkok","Asia/Singapore","Asia/Ho_Chi_Minh",
  "Asia/Tokyo","Asia/Seoul","Asia/Shanghai","Australia/Sydney","Pacific/Auckland",
];
function getTimezoneOptions(selected) {
  return TIMEZONES.map(tz =>
    `<option value="${tz}" ${tz === selected ? "selected" : ""}>${tz.replace(/_/g," ")}</option>`
  ).join("");
}
function tickTzClock() {
  const el = document.getElementById("tz-clock");
  if (!el) return;
  const trip = currentTrip();
  if (!trip?.timezone) return;
  try {
    el.textContent = new Intl.DateTimeFormat(undefined, {
      timeZone: trip.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date());
  } catch { el.textContent = "—"; }
}
let tzInterval = null;
function startTzClock() {
  stopTzClock();
  tickTzClock();
  tzInterval = setInterval(tickTzClock, 1000);
}
function stopTzClock() { if (tzInterval) { clearInterval(tzInterval); tzInterval = null; } }

// -------- ITINERARY TIME STATE --------
let itinInterval = null;
function stopItinClock() { if (itinInterval) { clearInterval(itinInterval); itinInterval = null; } }
function startItinClock() {
  stopItinClock();
  tickItinClock();
  itinInterval = setInterval(tickItinClock, 60_000);
}
function tickItinClock() { applyItineraryTimeState(); renderCurrentTimeLine(); }

function pad2(n) { return String(n).padStart(2, '0'); }
function calendarYmdLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function ymdInTimeZone(date, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    return calendarYmdLocal(date);
  }
}
function tripDayYmd(startDate, dIdx) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dIdx);
  return calendarYmdLocal(d);
}
function itinTimeZone(trip) {
  const tz = (trip?.timezone || '').trim();
  return tz || null;
}
function itinTodayYmd(trip) {
  const now = new Date();
  const tz = itinTimeZone(trip);
  return tz ? ymdInTimeZone(now, tz) : calendarYmdLocal(now);
}
function tzOffsetMs(timeZone, date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}
function wallTimeInZone(year, month, day, hour, minute, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(utcGuess - tzOffsetMs(timeZone, new Date(utcGuess)));
}

function parseSlotTime(dayDate, timeStr, timeZone) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  if (!timeZone) {
    const dt = new Date(dayDate);
    dt.setHours(h, min, 0, 0);
    return dt;
  }
  return wallTimeInZone(dayDate.getFullYear(), dayDate.getMonth() + 1, dayDate.getDate(), h, min, timeZone);
}

function applyItineraryTimeState() {
  const t = currentTrip();
  if (!t || !t.startDate) return;
  const now = new Date();
  const tz = itinTimeZone(t);
  const todayYmd = itinTodayYmd(t);
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const startDate = parseDate(t.startDate);
  if (!startDate) return;

  document.querySelectorAll('.itin-event.filled').forEach(cell => {
    const dIdx = parseInt(cell.dataset.didx);
    const sIdx = parseInt(cell.dataset.sidx);
    const span = parseInt(cell.dataset.span) || 1;
    const dayYmd = tripDayYmd(startDate, dIdx);
    if (dayYmd < todayYmd) { cell.classList.add('slot-past'); return; }
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dIdx);
    const startDt = parseSlotTime(dayDate, slots[sIdx], tz);
    const endDt   = parseSlotTime(dayDate, slots[Math.min(sIdx + span, slots.length - 1)], tz);
    if (!startDt || !endDt) return;
    const isOngoing = startDt <= now && now < endDt;
    cell.classList.toggle('slot-past', !isOngoing && endDt <= now);
  });
}

function renderCurrentTimeLine() {
  document.querySelectorAll('.itin-now-line').forEach(el => el.remove());
  const t = currentTrip();
  if (!t || !t.startDate) return;
  const now = new Date();
  const tz = itinTimeZone(t);
  const slots = t.timeSlots || TIME_SLOTS_DEFAULT;
  const startDate = parseDate(t.startDate);
  if (!startDate) return;

  const todayYmd = itinTodayYmd(t);
  let todayDIdx = -1;
  for (let i = 0; i < t.itinerary.length; i++) {
    if (tripDayYmd(startDate, i) === todayYmd) { todayDIdx = i; break; }
  }
  if (todayDIdx === -1) return;

  if (window.innerWidth <= 600 && window.itinMobileDay !== todayDIdx) return;

  const grid = document.querySelector('.itin-grid');
  if (!grid) return;
  const timeCells = Array.from(grid.querySelectorAll('.itin-cell.time'))
    .filter(c => c.textContent.trim() !== 'Time');
  if (!timeCells.length) return;

  const dayDate = new Date(startDate);
  dayDate.setDate(dayDate.getDate() + todayDIdx);
  const slotDates = slots.map(s => parseSlotTime(dayDate, s, tz));
  const first = slotDates[0];
  const last = slotDates[slotDates.length - 1];
  if (!first || !last) return;

  const gridRect = grid.getBoundingClientRect();
  let yPos = null;

  if (now <= first) {
    yPos = timeCells[0].getBoundingClientRect().top - gridRect.top;
  } else if (now >= last) {
    yPos = timeCells[timeCells.length - 1].getBoundingClientRect().bottom - gridRect.top;
  } else {
    for (let i = 0; i < slotDates.length - 1; i++) {
      const t0 = slotDates[i];
      const t1 = slotDates[i + 1];
      if (t0 && t1 && t0 <= now && now < t1) {
        const r1 = timeCells[i].getBoundingClientRect();
        const r2 = timeCells[i + 1].getBoundingClientRect();
        const frac = (now - t0) / (t1 - t0);
        yPos = (r1.top - gridRect.top) + frac * (r2.top - r1.top);
        break;
      }
    }
  }

  if (yPos === null) return;
  const line = document.createElement('div');
  line.className = 'itin-now-line';
  line.style.top = `${yPos}px`;
  grid.appendChild(line);
}

// -------- HELPERS --------
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function parseDate(d) { if (!d) return null; const x = new Date(d + "T00:00:00"); return isNaN(x) ? null : x; }
function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
function daysUntil(dateStr) {
  const d = parseDate(dateStr); if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  return daysBetween(today, d);
}
function fmtDate(dateStr, opts={month:"short",day:"numeric",year:"numeric"}) {
  const d = parseDate(dateStr); if (!d) return "";
  return d.toLocaleDateString(undefined, opts);
}
function fmtBookingTime(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  const hasTime = val.includes("T") && !val.endsWith("T");
  if (hasTime) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
           d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function tripDuration(t) {
  if (!t.startDate || !t.endDate) return null;
  return daysBetween(parseDate(t.startDate), parseDate(t.endDate)) + 1;
}
function escapeAttr(s) { return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

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

