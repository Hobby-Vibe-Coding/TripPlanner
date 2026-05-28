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


// -------- RESERVATIONS SEARCH / PAGINATION STATE --------
let resPage = 0;
let resPageSize = 10;
let resSearch = "";
function setResPage(page) { resPage = page; render(); }
function setResPageSize(size) { resPageSize = parseInt(size); resPage = 0; render(); }
function setResSearch(query) {
  resSearch = query;
  resPage = 0;
  render();
  const el = document.getElementById("reservation-search");
  if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}

function resOpenHref(link) {
  const u = (link || "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : "https://" + u;
}

// -------- RESERVATIONS TAB --------
function renderReservations(t, printMode) {
  const rs = t.reservations || [];

  const itemsWithIdx = rs.map((r, i) => ({ r, i }));
  const q = resSearch.toLowerCase().trim();
  const searchFiltered = q ? itemsWithIdx.filter(({ r }) =>
    (r.name || "").toLowerCase().includes(q)
    || (r.status || "").toLowerCase().includes(q)
    || (r.confNum || "").toLowerCase().includes(q)
    || (r.link || "").toLowerCase().includes(q)
    || (r.note || "").toLowerCase().includes(q)
    || (r.dueDate || "").toLowerCase().includes(q)
    || fmtBookingTime(r.dueDate).toLowerCase().includes(q)
  ) : itemsWithIdx;

  const totalPages = (!printMode && resPageSize > 0)
    ? Math.max(1, Math.ceil(searchFiltered.length / resPageSize))
    : 1;
  const safePage = Math.min(resPage, totalPages - 1);
  const pageStart = printMode ? 0 : safePage * resPageSize;
  const pageEnd = printMode ? searchFiltered.length : pageStart + resPageSize;
  const pagedItems = searchFiltered.slice(pageStart, pageEnd);

  const rows = pagedItems.map(({ r, i }) => `
    <tr>
      <td class="col-item"><input value="${escapeHtml(r.name||"")}" onchange="updateRes(${i},'name',this.value)" placeholder="What to book" /></td>
      <td class="col-status">
        <div class="res-status-cell">
          <select class="res-status-select" onchange="updateRes(${i},'status',this.value)" id="res-sel-${i}">
            <option value="pending" ${r.status==="pending"?"selected":""}>Pending</option>
            <option value="booked" ${r.status==="booked"?"selected":""}>Booked</option>
            <option value="cancelled" ${r.status==="cancelled"?"selected":""}>Cancelled</option>
          </select>
          <span class="res-status ${r.status||"pending"}" onclick="document.getElementById('res-sel-${i}').click()">${(r.status||"pending")}</span>
        </div>
      </td>
      <td><input type="datetime-local" value="${r.dueDate||""}" onchange="updateRes(${i},'dueDate',this.value)" style="font-size:12px;" /></td>
      <td><input value="${escapeHtml(r.confNum||"")}" onchange="updateRes(${i},'confNum',this.value)" placeholder="—" /></td>
      <td class="col-link">
        <div class="res-link-cell">
          <input class="res-link-input" value="${escapeHtml(r.link||"")}" onchange="updateRes(${i},'link',this.value)" placeholder="https://..." />
          ${r.link?.trim() ? `<a href="${escapeAttr(resOpenHref(r.link))}" target="_blank" rel="noopener noreferrer" class="res-open-btn" title="Open link">Open ↗</a>` : ""}
        </div>
      </td>
      <td class="col-note"><textarea rows="2" onchange="updateRes(${i},'note',this.value)">${escapeHtml(r.note||"")}</textarea></td>
      <td class="row-actions no-print">
        <button class="icon-btn" onclick="deleteRes(${i})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </td>
    </tr>
  `).join("");

  return `
    <div class="panel">
      <div class="panel-head">
        <h3>Reservations & must-book list</h3>
        <div class="actions">
          <button class="btn sm primary" onclick="addRes()">+ Add reservation</button>
        </div>
      </div>

      ${rs.length > 0 ? `
        <div class="no-print" style="display:flex;align-items:center;margin-bottom:15px;">
          <div style="flex:8;position:relative;">
            <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink-soft);pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="reservation-search" type="text" placeholder="Search by item, status, confirm #, link, note…"
              value="${escapeHtml(resSearch)}"
              oninput="setResSearch(this.value)"
              style="width:100%;padding:7px 10px 7px 30px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;background:var(--surface-2);box-sizing:border-box;" />
            ${resSearch ? `<button onclick="setResSearch('')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-soft);font-size:16px;line-height:1;padding:0;" title="Clear">×</button>` : ''}
          </div>
          <div style="flex:2;"></div>
          <div style="flex:2;display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:13px;color:var(--ink-soft);white-space:nowrap;">
            Rows per page:
            <select onchange="setResPageSize(this.value)" style="padding:3px 6px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:13px;background:var(--surface-2);">
              ${[5,10,15,20].map(n => `<option value="${n}" ${resPageSize===n?'selected':''}>${n}</option>`).join('')}
            </select>
          </div>
        </div>
      ` : ''}

      ${rs.length === 0 ? `
        <div class="empty-mini">
          <h4>Nothing to book yet 🎟️</h4>
          <p>Track tours, restaurants, tickets, and anything that needs advance booking.</p>
          <button class="btn primary sm" onclick="addRes()" style="margin-top:8px;">+ Add first reservation</button>
        </div>
      ` : `
        <div class="t-wrap">
          <table class="t">
            <thead><tr>
              <th class="col-item">Item</th><th class="col-status">Status</th><th>Booking time</th><th>Confirm #</th>
              <th class="col-link">Link</th><th class="col-note">Note</th><th class="no-print"></th>
            </tr></thead>
            <tbody>${rows || `<tr><td colspan="7" style="padding:20px 12px;color:var(--ink-soft);text-align:center;">No reservations match "<strong>${escapeHtml(resSearch)}</strong>".</td></tr>`}</tbody>
          </table>
        </div>

        ${!printMode && searchFiltered.length > 0 ? `
        <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:13px;">
          <div style="color:var(--ink-soft);">
            ${(() => {
              const count = searchFiltered.length;
              const parts = [];
              if (q) parts.push(`matching "<strong>${escapeHtml(resSearch)}</strong>"`);
              return `Showing ${count} reservation${count !== 1 ? 's' : ''}${parts.length ? ' ' + parts.join(' ') : ''}.`;
            })()}
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--ink-soft);margin-right:4px;">Page ${safePage+1} of ${totalPages}</span>
            <button class="btn sm" onclick="setResPage(${safePage-1})" ${safePage===0?'disabled':''} style="min-width:32px;">‹</button>
            ${Array.from({length:totalPages},(_,k)=>k).filter(k=>Math.abs(k-safePage)<=2||k===0||k===totalPages-1).reduce((acc,k,idx,arr)=>{
              if(idx>0&&k-arr[idx-1]>1) acc.push('<span style="color:var(--ink-soft);padding:0 2px;">…</span>');
              acc.push(`<button class="btn sm ${k===safePage?'primary':''}" onclick="setResPage(${k})" style="min-width:32px;">${k+1}</button>`);
              return acc;
            },[]).join('')}
            <button class="btn sm" onclick="setResPage(${safePage+1})" ${safePage===totalPages-1?'disabled':''} style="min-width:32px;">›</button>
          </div>
        </div>` : ''}
      `}
    </div>
  `;
}
function addRes() {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.reservations = t.reservations || [];
  t.reservations.push({ id: uid(), name: "", status: "pending", dueDate: "", confNum: "", link: "", note: "" });
  saveState(); render();
}
function updateRes(i, key, value) {
  if (!guardEdit()) return;
  currentTrip().reservations[i][key] = value; saveState(); if (key==="status" || key==="link") render();
}
function deleteRes(i) {
  if (!guardEdit()) return;
  currentTrip().reservations.splice(i, 1); saveState(); render();
}

Object.assign(window, {
  renderReservations, addRes, updateRes, deleteRes,
  setResPage, setResPageSize, setResSearch,
});
