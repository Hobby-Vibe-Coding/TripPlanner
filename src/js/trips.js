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
const renderLightbox = ()   => window.renderLightbox();
const openCoverLightbox = (fileId) => window.openCoverLightbox(fileId);


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

const PACKING_TEMPLATE = [
  { name: "Essentials", items: ["First aid kit", "Advil / pain reliever", "Cough drops", "Hydrocortisone", "Band-aids", "Hand sanitizer", "Tissues", "Masks"] },
  { name: "Clothes",    items: ["Pajamas", "Jacket / layers", "Underwear & socks", "3 outfits", "Swimwear", "Comfortable walking shoes"] },
  { name: "Electronics",items: ["Phone charger", "Power bank", "USB adapter", "Headphones / AirPods", "Camera", "Laptop / iPad"] },
  { name: "Skincare",   items: ["Cleanser", "Moisturizer", "Sunscreen (face)", "Cotton pads", "Acne patches", "Lip balm"] },
  { name: "Beauty",     items: ["Mascara", "Lipstick", "Eyebrow pencil", "Makeup remover", "Eyelash curler"] },
  { name: "Body care",  items: ["Body wash", "Shampoo & conditioner", "Body lotion", "Sunscreen (body)", "Deodorant"] },
  { name: "Hair care",  items: ["Hair dryer", "Comb / brush", "Hair ties", "Curler / straightener"] },
  { name: "Dental",     items: ["Toothbrush", "Toothpaste", "Floss / flosser", "Mouthwash"] },
  { name: "Outside kit",items: ["Umbrella", "Hat / cap", "Tote / reusable bag", "Sunglasses", "Sandals"] },
  { name: "Documents",  items: ["ID / Driver license", "Passport", "Wallet & cards", "Reservation printouts", "Insurance card"] },
  { name: "Miscellaneous", items: ["Tripod", "Snacks", "Board games", "Travel iron", "Lint roller"] }
];

// -------- TRIP MODEL --------
function newTrip(data) {
  if (!guardEdit()) return null;
  const start = data.startDate ? parseDate(data.startDate) : null;
  const end = data.endDate ? parseDate(data.endDate) : null;
  const days = (start && end) ? daysBetween(start, end) + 1 : 3;
  const trip = {
    id: uid(),
    title: data.title || "New Trip",
    destination: data.destination || "",
    emoji: data.emoji || "🏖️",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    travelers: (data.travelers || "").split(",").map(s => s.trim()).filter(Boolean).filter((n, i, a) => a.findIndex(x => x.toLowerCase() === n.toLowerCase()) === i),
    budget: data.budget ? parseFloat(data.budget) : null,
    expenses: [],
    packing: data.useTemplate
      ? PACKING_TEMPLATE.map(c => ({ id: uid(), name: c.name, listType: "packing", items: c.items.map(i => ({ id: uid(), name: i, packed: false })) }))
      : [],
    itinerary: Array.from({ length: days }, (_, i) => ({
      id: uid(),
      theme: "",
      slots: TIME_SLOTS_DEFAULT.map(t => ({ time: t, activity: "" }))
    })),
    reservations: [],
    notes: [],
    timeSlots: TIME_SLOTS_DEFAULT.slice(),
    timezone: "",
    createdAt: new Date().toISOString(),
    driveFolder: { folderId: null, thumbnailId: null, thumbnailUrl: null },
    destinationCoords: data.destinationCoords || null
  };
  state.trips.push(trip); mutate({ type: 'createTrip', trip }); return trip;
}

function deleteTrip(id) {
  state.trips = state.trips.filter(t => t.id !== id);
  mutate({ type: 'deleteTrip', tripId: id });
}
function duplicateTrip(id, ev) {
  if (ev) ev.stopPropagation();
  const src = state.trips.find(t => t.id === id);
  if (!src) return;
  const clone = JSON.parse(JSON.stringify(src));
  clone.id = uid();
  clone.title = src.title + " (copy)";
  clone.startDate = "";
  clone.endDate = "";
  clone.expenses = [];
  clone.createdAt = new Date().toISOString();
  // Reset packing items to unpacked
  (clone.packing || []).forEach(cat => cat.items.forEach(item => { item.packed = false; item.id = uid(); }));
  state.trips.push(clone);
  mutate({ type: 'createTrip', trip: clone });
  if (route.view === "home" && typeof window.homePanelRender === "function") window.homePanelRender();
  else render();
}

// -------- TRIP-LEVEL UPDATES --------
const _tripFieldTimers = {};
function updateTrip(key, value) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  t[key] = value;
  if (["budget","timezone"].includes(key)) render();
  clearTimeout(_tripFieldTimers[key]);
  _tripFieldTimers[key] = setTimeout(
    () => mutate({ type: 'updateTripFields', tripId: t.id, fields: { [key]: value } }),
    400
  );
}
function updateTripDates(which, value) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (which === "start") t.startDate = value; else t.endDate = value;
  syncItineraryToDateRange(t);
  const fields = which === "start" ? { startDate: value } : { endDate: value };
  mutate({ type: 'updateTripFields', tripId: t.id, fields });
  // Sync itinerary days/slots if length changed
  mutate({ type: 'syncTimeSlots', tripId: t.id, timeSlots: t.timeSlots || [], days: t.itinerary });
  render();
}

function syncItineraryToDateRange(t) {
  if (!t.startDate || !t.endDate) return;
  const dur = tripDuration(t);
  if (dur === null || dur < 1) return;
  const targetDays = dur; // tripDuration already returns inclusive day count (daysBetween + 1)
  while (t.itinerary.length < targetDays) {
    t.itinerary.push({ id: uid(), theme: "", events: [] });
  }
  if (t.itinerary.length > targetDays) {
    t.itinerary = t.itinerary.slice(0, targetDays);
  }
}
function confirmDeleteTrip() {
  const t = currentTrip(); if (!t) return;
  if (!confirm(`Delete "${t.title}"? This cannot be undone.`)) return;
  deleteTrip(t.id); goHome();
}

// -------- TRIP AVATAR MENU --------
function openTripAvatarMenu() {
  const existing = document.getElementById("avatar-menu");
  if (existing) { existing.remove(); return; }
  const t = currentTrip();
  if (!t?.driveFolder?.thumbnailId) return;
  const shareReadOnly = document.documentElement.getAttribute("data-share") === "read";
  const menu = document.createElement("div");
  menu.id = "avatar-menu";
  menu.className = "avatar-menu";
  menu.innerHTML = `
    <button onclick="openCoverPhotoLightbox()">🔍 View image</button>
    ${!shareReadOnly ? `<hr>
    <button onclick="setTab('photos');closeAvatarMenu()">🖼️ Change image</button>
    <button class="danger" onclick="removeCoverPhoto()">😊 Change to emoji</button>` : ""}
  `;
  const avatar = document.querySelector(".trip-emoji");
  const rect = avatar ? avatar.getBoundingClientRect() : { bottom: 100, left: 30 };
  menu.style.top = (rect.bottom + 8) + "px";
  menu.style.left = rect.left + "px";
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener("click", _closeAvatarMenuOutside, { once: true }), 0);
}
function _closeAvatarMenuOutside(e) {
  const menu = document.getElementById("avatar-menu");
  if (menu && !menu.contains(e.target)) menu.remove();
}
function closeAvatarMenu() { document.getElementById("avatar-menu")?.remove(); }
function openCoverPhotoLightbox() {
  closeAvatarMenu();
  const t = currentTrip();
  const thumbnailId = t?.driveFolder?.thumbnailId;
  if (!thumbnailId) return;
  openCoverLightbox(thumbnailId);
}
function removeCoverPhoto() {
  closeAvatarMenu();
  if (!guardEdit()) return;
  if (!confirm("Remove the cover photo and revert to the trip emoji?")) return;
  const t = currentTrip(); if (!t) return;
  if (!t.driveFolder) return;
  t.driveFolder.thumbnailId = null;
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { driveThumbnailId: null } });
  render();
}

// -------- EMOJI PICKER --------
function openEmojiPicker() {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  showModal({
    title: "Choose a trip icon",
    body: `<div class="emoji-picker">${
      EMOJI_OPTIONS.map(e => `<button class="${t.emoji===e?"sel":""}" onclick="pickEmoji('${e}')">${e}</button>`).join("")
    }</div><div class="hint" style="margin-top:12px;">Or paste any emoji here: <input id="custom-emoji" style="width:60px;padding:6px;border:1px solid var(--line);border-radius:6px;font-size:18px;" onchange="pickEmoji(this.value)"/></div>`,
    actions: [{ label: "Close", onClick: closeModal }]
  });
}
function pickEmoji(e) {
  e = (e || "").trim(); if (!e) return;
  const t = currentTrip(); t.emoji = e;
  mutate({ type: 'updateTripFields', tripId: t.id, fields: { emoji: e } });
  closeModal(); render();
}

// -------- NEW TRIP MODAL --------
function openNewTrip() {
  window.resetNtDestCoords?.(); // reset packing.js-owned ntDestCoords
  showModal({
    title: "Plan a new trip",
    body: `
      <div class="field">
        <label>Trip name *</label>
        <input id="nt-title" placeholder="e.g. Tokyo Summer 2026" autofocus />
      </div>
      <div class="field">
        <label>Destination</label>
        <div class="dest-ac-wrap" style="width:100%;">
          <input id="nt-dest" placeholder="e.g. Tokyo, Japan" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font-size:14px;color:var(--ink);background:var(--surface-2);"
            oninput="onNtDestInput(this.value)" onblur="setTimeout(closeNtDestDropdown, 200)" autocomplete="off" />
          <div id="nt-dest-dropdown" class="dest-dropdown" style="left:0;min-width:100%;"></div>
        </div>
      </div>
      <div class="row" style="gap:12px;">
        <div class="field" style="flex:1;"><label>Start date</label><input id="nt-start" type="date" /></div>
        <div class="field" style="flex:1;"><label>End date</label><input id="nt-end" type="date" /></div>
      </div>
      <div class="field">
        <label>Travelers (comma separated)</label>
        <input id="nt-trav" placeholder="e.g. Hoang, Sam, Maya" />
      </div>
      <div class="field">
        <label>Budget per person (${state.settings.currency}, optional)</label>
        <input id="nt-budget" type="number" step="0.01" placeholder="e.g. 500" />
      </div>
      <div class="field">
        <label>Icon</label>
        <div class="emoji-picker" id="nt-emoji-grid">
          ${EMOJI_OPTIONS.slice(0,16).map((e,i) => `<button class="${i===0?'sel':''}" data-e="${e}" onclick="selectNtEmoji(this)">${e}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label><input type="checkbox" id="nt-template" checked style="width:auto;margin-right:6px;"/> Pre-fill packing list with smart defaults</label>
        <div class="hint">Recommended — gives you 11 categories with common items. All editable.</div>
      </div>
    `,
    actions: [
      { label: "Cancel", onClick: closeModal },
      { label: "Create trip", primary: true, onClick: () => {
        const title = document.getElementById("nt-title").value.trim();
        if (!title) { alert("Please give your trip a name."); return; }
        const emojiSel = document.querySelector("#nt-emoji-grid .sel");
        const trip = newTrip({
          title,
          destination: document.getElementById("nt-dest").value,
          destinationCoords: window.getNtDestCoords?.() ?? null,
          startDate: document.getElementById("nt-start").value,
          endDate: document.getElementById("nt-end").value,
          travelers: document.getElementById("nt-trav").value,
          budget: document.getElementById("nt-budget").value,
          emoji: emojiSel ? emojiSel.dataset.e : "🏖️",
          useTemplate: document.getElementById("nt-template").checked
        });
        if (!trip) return;
        closeModal(); openTrip(trip.id);
      }}
    ]
  });
}
function selectNtEmoji(btn) {
  document.querySelectorAll("#nt-emoji-grid .sel").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
}

Object.assign(window, {
  newTrip, deleteTrip, duplicateTrip,
  updateTrip, updateTripDates, syncItineraryToDateRange, confirmDeleteTrip,
  openTripAvatarMenu, closeAvatarMenu, openCoverPhotoLightbox, removeCoverPhoto,
  openEmojiPicker, pickEmoji,
  openNewTrip, selectNtEmoji,
  PACKING_TEMPLATE,
});

