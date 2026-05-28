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


// -------- OVERVIEW TAB --------
function renderOverview(t) {
  const totalSpend = (t.expenses || []).reduce((s, e) => s + (parseFloat(e.cost) || 0), 0);
  const numPeople = Math.max(1, (t.travelers || []).length);
  const nextRes = (t.reservations || []).filter(r => r.status !== "booked" && r.status !== "cancelled" && r.name?.trim()).slice(0, 3);
  const themes = (t.itinerary || []).map((d, i) => ({ i: i+1, theme: d.theme })).filter(x => x.theme);
  const shareReadOnly = document.documentElement.getAttribute("data-share") === "read";
  return `
    <div class="panel">
      <div class="panel-head">
        <h3>At a glance</h3>
      </div>

      <div class="overview-grid">

        ${renderWeatherWidget(t)}

        <div class="stat overview-travelers" style="padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div class="stat-label" style="margin:0;">Travelers</div>
            ${shareReadOnly ? "" : `<div style="display:flex;gap:6px;align-items:center;">
              <button class="trav-edit-btn${travEditMode?' active':''}" onclick="toggleTravEditMode()">${travEditMode ? "Done" : "✎ Edit"}</button>
              <button class="btn sm ghost" onclick="openGroupsModal('${t.id}')">Groups →</button>
            </div>`}
          </div>
          ${(() => {
            const groups = t.groups || [];
            const travelers = t.travelers || [];
            if (!travelers.length) return `<span class="muted text-sm">${shareReadOnly ? "No travelers listed." : "Add travelers below ↓"}</span>`;
            if (shareReadOnly) {
              return travelers.map(p => {
                const isMe = getMyTraveler(t.id) === p;
                return `<span class="tag ${isMe?'is-me':''}" onclick="setMyTraveler('${escapeAttr(p)}')" style="cursor:pointer;"
                  title="${isMe?'This is you! Click to unset.':'Click to set as you'}">${escapeHtml(p)}${isMe?' <span class="me-badge">(You)</span>':''}</span>`;
              }).join(" ");
            }
            // Group-aware display: show groups first, then ungrouped
            const grouped = new Set(groups.flatMap(g => g.members));
            const ungrouped = travelers.filter(p => !grouped.has(p));
            const wrapClass = travEditMode ? "trav-edit-mode" : "";
            let html = `<div class="${wrapClass}">`;
            groups.forEach(g => {
              const members = g.members.filter(p => travelers.includes(p));
              if (!members.length) return;
              html += `<div style="margin-bottom:8px;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);margin-bottom:4px;">${escapeHtml(g.name)}</div>
                <div>${members.map(p => {
                  const isMe = getMyTraveler(t.id) === p;
                  const click = travEditMode ? "" : `onclick="setMyTraveler('${escapeAttr(p)}')"`;
                  const title = travEditMode ? "" : `title="${isMe?'This is you! Click to unset.':'Click to set as you'}"`;
                  return `<span class="tag ${isMe?'is-me':''}" ${click} ${title}>${escapeHtml(p)}${isMe?' <span class="me-badge">(You)</span>':''}<button class="trav-remove-x" onclick="event.stopPropagation();removeTraveler('${escapeAttr(p)}')" title="Remove ${escapeAttr(p)}">✕</button></span>`;
                }).join(" ")}</div>
              </div>`;
            });
            if (ungrouped.length) {
              html += `<div>${ungrouped.map(p => {
                const isMe = getMyTraveler(t.id) === p;
                const click = travEditMode ? "" : `onclick="setMyTraveler('${escapeAttr(p)}')"`;
                const title = travEditMode ? "" : `title="${isMe?'This is you! Click to unset.':'Click to set as you'}"`;
                return `<span class="tag ${isMe?'is-me':''}" ${click} ${title}>${escapeHtml(p)}${isMe?' <span class="me-badge">(You)</span>':''}<button class="trav-remove-x" onclick="event.stopPropagation();removeTraveler('${escapeAttr(p)}')" title="Remove ${escapeAttr(p)}">✕</button></span>`;
              }).join(" ")}</div>`;
            }
            html += `</div>`;
            return html;
          })()}
          ${shareReadOnly ? `
          <div style="margin-top:6px;"><span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">Tap your name to track your share</span></div>
          ` : `
          <div style="margin-top:6px;"><span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">Tap your name to track your share</span></div>
          <div style="margin-top:10px;">
            <input id="trav-input" placeholder="Add traveler name + Enter"
                   style="width:100%;padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:var(--surface-2);"
                   onkeydown="if(event.key==='Enter'){addTraveler(this.value);this.value='';}"/>
          </div>`}
        </div>

        ${(() => {
          const myTraveler = getMyTraveler(t.id);
          const myData = myTraveler ? computeMyData(t) : null;
          if (!myData) return `
          <div class="my-summary overview-my-summary" style="opacity:0.6;">
            <div class="my-summary-head">
              <h4>My Summary</h4>
            </div>
            <p class="hint" style="margin:8px 0 0;">👆 Tap your name in the Travelers list above to see your personal expense breakdown.</p>
          </div>`;
          const me = myTraveler;
          return `
          <div class="my-summary overview-my-summary">
            <div class="my-summary-head">
              <h4>My Summary — ${escapeHtml(me)}</h4>
              <button class="btn sm ghost" onclick="openPersonDetail('${escapeAttr(me)}')">View full details →</button>
            </div>
            <div class="my-summary-stats">
              <div class="my-stat">
                <div class="label">My Share</div>
                <div class="value">${fmtCurrency(myData.myOwed)}</div>
              </div>
              <div class="my-stat">
                <div class="label">I Paid</div>
                <div class="value">${fmtCurrency(myData.myPaid)}</div>
              </div>
              <div class="my-stat">
                <div class="label">Balance</div>
                <div class="value" style="color:${myData.net > 0.01 ? 'var(--primary)' : myData.net < -0.01 ? '#c0392b' : 'var(--ink-soft)'}">
                  ${myData.net > 0.01 ? 'Owed ' + fmtCurrency(myData.net) : myData.net < -0.01 ? 'Owe ' + fmtCurrency(-myData.net) : 'Even'}
                </div>
              </div>
              ${myData.owesMe.length > 0 ? `
              <div class="my-stat">
                <div class="label">Owed to me</div>
                <div class="value" style="color:#c0392b;font-size:${myData.owesMe.length > 2 ? '12px' : '14px'};line-height:1.5;">
                  ${myData.owesMe.map(d => escapeHtml(d.name)).join('<br>')}
                </div>
              </div>` : ""}
              ${myData.myOwed > 0 && myData.myUnsettled < 0.01 && myData.owesMe.length === 0 ? `
              <div class="my-stat">
                <div class="label">Settled</div>
                <div class="value" style="color:#2e7d32">✓ All</div>
              </div>` : ""}
            </div>
            ${(() => {
              const detailed = buildDetailedDebts(t);
              const hasOwesMe = simplifyDebts ? myData.owesMe.length > 0 : detailed.owesMe.length > 0;
              const hasIOwe   = simplifyDebts ? myData.iOwe.length > 0   : detailed.iOwe.length > 0;
              const settleBtn = (fn) => isEditing() ? `<button class="btn sm" onclick="${fn}" style="margin:0 6px;font-size:11px;padding:2px 8px;white-space:nowrap;">✓ Settle</button>` : '';
              const toggleHtml = (hasOwesMe || hasIOwe) ? `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;">
                  <span style="color:var(--ink-soft);">View:</span>
                  <button class="btn sm ${simplifyDebts ? 'primary' : ''}" onclick="setSimplifyDebts(true)">Simplified</button>
                  <button class="btn sm ${!simplifyDebts ? 'primary' : ''}" onclick="setSimplifyDebts(false)">Per expense</button>
                </div>` : '';
              const owesMeRows = simplifyDebts
                ? myData.owesMe.map(d => `
                    <div class="my-debt-row">
                      <span class="name">${escapeHtml(d.name)}</span>
                      ${settleBtn("settleWithPerson('" + escapeAttr(d.name) + "')")}
                      <span class="amt owed-to-me">+${fmtCurrency(d.amount)}</span>
                    </div>`).join("")
                : detailed.owesMe.map(d => `
                    <div class="my-debt-row">
                      <span class="name" style="flex-shrink:0;">${escapeHtml(d.name)}</span>
                      <span style="color:var(--ink-soft);font-size:11px;flex:1;margin:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(d.expenseName)}">${escapeHtml(d.expenseName)}</span>
                      ${settleBtn("settleOneDebt(" + d.expenseIdx + ",'" + escapeAttr(d.name) + "')")}
                      <span class="amt owed-to-me" style="flex-shrink:0;">+${fmtCurrency(d.amount)}</span>
                    </div>`).join("");
              const iOweRows = simplifyDebts
                ? myData.iOwe.map(d => `
                    <div class="my-debt-row">
                      <span class="name">${escapeHtml(d.name)}</span>
                      ${settleBtn("settleWithPerson('" + escapeAttr(d.name) + "')")}
                      <span class="amt i-owe">-${fmtCurrency(d.amount)}</span>
                    </div>`).join("")
                : detailed.iOwe.map(d => `
                    <div class="my-debt-row">
                      <span class="name" style="flex-shrink:0;">${escapeHtml(d.name)}</span>
                      <span style="color:var(--ink-soft);font-size:11px;flex:1;margin:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(d.expenseName)}">${escapeHtml(d.expenseName)}</span>
                      ${settleBtn("settleOneDebt(" + d.expenseIdx + ",'" + escapeAttr(me) + "')")}
                      <span class="amt i-owe" style="flex-shrink:0;">-${fmtCurrency(d.amount)}</span>
                    </div>`).join("");
              return toggleHtml
                + (hasOwesMe ? `<div class="my-debts"><div class="my-debts-title">People who owe me</div>${owesMeRows}</div>` : '')
                + (hasIOwe ? `<div class="my-debts" style="margin-top:${hasOwesMe ? '10px' : '0'};"><div class="my-debts-title">I owe</div>${iOweRows}</div>` : '');
            })()}
            ${!buildDetailedDebts(t).owesMe.length && !buildDetailedDebts(t).iOwe.length && myData.myOwed > 0 ? `
              <div style="text-align:center;color:var(--ink-soft);font-size:13px;padding:8px;">All settled up — no outstanding debts!</div>
            ` : ''}
            ${myData.myOwed === 0 ? `
              <div style="text-align:center;color:var(--ink-soft);font-size:13px;padding:8px;">No expenses yet. Add some in the Expenses tab.</div>
            ` : ''}
          </div>
          `;
        })()}

        <div class="stat overview-budget" style="padding:16px;">
          <div class="stat-label">Budget <span class="muted text-sm" style="text-transform:none;letter-spacing:0;font-weight:500;">(per person)</span></div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <input type="number" step="0.01" placeholder="—" value="${t.budget||""}" onchange="updateTrip('budget', this.value ? parseFloat(this.value) : null)"
                   style="font-size:22px;font-weight:700;color:var(--ink);border:none;background:transparent;width:140px;"/>
            <span class="muted text-sm">${state.settings.currency} / person</span>
          </div>
          ${t.budget && !shareReadOnly ? (() => {
            const myTraveler = getMyTraveler(t.id);
            const myData = myTraveler ? computeMyData(t) : null;
            if (myData) {
              // Personal view
              const mySpend = myData.myOwed;
              const over = mySpend > t.budget;
              const remain = t.budget - mySpend;
              return `
              <div class="text-sm" style="margin-top:6px;color:${over ? '#c0392b' : 'var(--ink-soft)'};">
                ${over ? "⚠️ Over by " + fmtCurrency(mySpend - t.budget) : fmtCurrency(remain) + " remaining"} · your share
              </div>
              <div class="pack-bar" style="margin-top:8px;"><div class="pack-bar-fill" style="width:${Math.min(100, mySpend/t.budget*100)}%;background:${over?'#e74c3c':'linear-gradient(90deg,var(--primary),var(--accent))'}"></div></div>
              `;
            }
            // Group view — no traveler selected
            const groupBudget = t.budget * numPeople;
            const groupOver = totalSpend > groupBudget;
            const groupRemain = groupBudget - totalSpend;
            return `
            <div class="text-sm" style="margin-top:6px;color:var(--ink-soft);">Group budget: ${fmtCurrency(groupBudget)}</div>
            <div class="text-sm" style="margin-top:4px;color:${groupOver ? '#c0392b' : 'var(--ink-soft)'};">
              ${groupOver ? "⚠️ Over by " + fmtCurrency(totalSpend - groupBudget) : fmtCurrency(groupRemain) + " remaining"} · group total
            </div>
            <div class="pack-bar" style="margin-top:8px;"><div class="pack-bar-fill" style="width:${Math.min(100, totalSpend/groupBudget*100)}%;background:${groupOver?'#e74c3c':'linear-gradient(90deg,var(--primary),var(--accent))'}"></div></div>
            <div class="muted text-sm" style="margin-top:6px;">Tap your name in Travelers to see personal progress</div>
            `;
          })() : ""}
        </div>

        ${themes.length ? `
        <div class="stat overview-themes" style="padding:16px;">
          <div class="stat-label">Day themes</div>
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px;">
            ${themes.map(d => `<div style="font-size:15px;"><strong>Day ${d.i}:</strong> <span style="font-family:'Caveat',cursive;font-size:20px;color:var(--primary);">${escapeHtml(d.theme)}</span></div>`).join("")}
          </div>
        </div>
        ` : ""}

        ${nextRes.length ? `
        <div class="stat overview-needs" style="padding:16px;">
          <div class="stat-label">⚠️ Need to book</div>
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
            ${nextRes.map(r => `<div class="text-sm">• ${escapeHtml(r.name)}${r.dueDate ? ` <span class="muted">by ${fmtBookingTime(r.dueDate)}</span>`:""}</div>`).join("")}
          </div>
          <button class="btn sm" style="margin-top:10px;" onclick="setTab('reservations')">View all →</button>
        </div>
        ` : ""}
      </div>
    </div>
  `;
}

// -------- TRAVELER GROUPS --------
function openGroupsModal(tripId) {
  renderGroupsModal(tripId);
}

function renderGroupsModal(tripId) {
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t) return;
  t.groups = t.groups || [];
  const travelers = t.travelers || [];

  const grouped = new Set(t.groups.flatMap(g => g.members.filter(p => travelers.includes(p))));
  const ungrouped = travelers.filter(p => !grouped.has(p));

  const lanesHtml = t.groups.map((g, gi) => {
    const members = g.members.filter(p => travelers.includes(p));
    return `
      <div class="group-lane" id="glane-${gi}"
           ondragover="event.preventDefault();this.classList.add('drag-over')"
           ondragleave="this.classList.remove('drag-over')"
           ondrop="dropTravelerIntoGroup(event,${gi},'${escapeAttr(tripId)}')">
        <div class="group-lane-header">
          <input class="group-lane-name" value="${escapeAttr(g.name)}"
                 onchange="renameGroup(${gi},'${escapeAttr(tripId)}',this.value)"
                 onblur="renameGroup(${gi},'${escapeAttr(tripId)}',this.value)" />
          <button class="btn sm ghost" style="padding:2px 8px;font-size:11px;color:#c0392b;"
                  onclick="deleteGroup(${gi},'${escapeAttr(tripId)}')">Remove</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;">
          ${members.length ? members.map(p => travDraggableChip(p, gi)).join("") : `<span class="muted text-sm">Drag travelers here</span>`}
        </div>
      </div>`;
  }).join("");

  const ungroupedHtml = `
    <div class="group-lane" id="glane-ungrouped" style="border-style:solid;background:var(--surface-2);"
         ondragover="event.preventDefault();this.classList.add('drag-over')"
         ondragleave="this.classList.remove('drag-over')"
         ondrop="dropTravelerIntoGroup(event,-1,'${escapeAttr(tripId)}')">
      <div class="group-lane-header">
        <span class="group-lane-name" style="cursor:default;">Ungrouped</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;">
        ${ungrouped.length ? ungrouped.map(p => travDraggableChip(p, -1)).join("") : `<span class="muted text-sm" style="font-size:12px;">All travelers are in groups</span>`}
      </div>
    </div>`;

  showModal({
    title: "Manage groups",
    size: "sm",
    body: `
      <div style="font-size:13px;color:var(--ink-soft);margin-bottom:12px;">
        Drag travelers between groups. Click a group name to rename it.
      </div>
      ${ungroupedHtml}
      ${lanesHtml}
      <button class="btn sm" style="margin-top:12px;width:100%;" onclick="addGroup('${escapeAttr(tripId)}')">+ New group</button>
    `,
    actions: [{ label: "Done", primary: true, onClick: () => { closeModal(); render(); } }],
  });
}

function travDraggableChip(name, groupIndex) {
  return `<span class="trav-draggable" draggable="true"
    ondragstart="event.dataTransfer.setData('text/plain','${escapeAttr(name)}|${groupIndex}')">${escapeHtml(name)}</span>`;
}

function dropTravelerIntoGroup(event, targetGroupIndex, tripId) {
  event.preventDefault();
  document.querySelectorAll('.group-lane').forEach(el => el.classList.remove('drag-over'));
  const data = event.dataTransfer.getData('text/plain');
  const [name, fromStr] = data.split('|');
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t || !name) return;
  t.groups = t.groups || [];

  // Remove from current group (if any)
  t.groups.forEach(g => { g.members = g.members.filter(m => m !== name); });

  // Add to target group
  if (targetGroupIndex >= 0 && t.groups[targetGroupIndex]) {
    if (!t.groups[targetGroupIndex].members.includes(name)) {
      t.groups[targetGroupIndex].members.push(name);
    }
  }
  saveState();
  renderGroupsModal(tripId);
}

function addGroup(tripId) {
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t) return;
  t.groups = t.groups || [];
  t.groups.push({ id: uid(), name: `Group ${t.groups.length + 1}`, members: [] });
  saveState();
  renderGroupsModal(tripId);
}

function renameGroup(groupIndex, tripId, newName) {
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t || !t.groups[groupIndex]) return;
  t.groups[groupIndex].name = (newName || "").trim() || t.groups[groupIndex].name;
  saveState();
}

function deleteGroup(groupIndex, tripId) {
  const t = (state.trips || []).find(x => x.id === tripId);
  if (!t) return;
  t.groups.splice(groupIndex, 1);
  saveState();
  renderGroupsModal(tripId);
}

function toggleTravEditMode() {
  if (!guardEdit()) return;
  setTravEditMode(!travEditMode);
  render();
}
function addTraveler(name) {
  if (!guardEdit()) return;
  name = (name || "").trim(); if (!name) return;
  const t = currentTrip(); if (!t) return;
  t.travelers = t.travelers || [];
  t.travelers.push(name); saveState(); render();
}
function removeTraveler(name) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  t.travelers = (t.travelers || []).filter(p => p !== name);
  if (getMyTraveler(t.id) === name) localStorage.removeItem("myTraveler_" + t.id);
  saveState(); render();
}
function getMyTraveler(tripId) {
  return localStorage.getItem("myTraveler_" + tripId) || null;
}
function setMyTraveler(name) {
  const t = currentTrip(); if (!t) return;
  const current = getMyTraveler(t.id);
  if (isShareMode() && current && current !== name) {
    showModal({
      title: "Switch traveler?",
      size: "sm",
      body: `<p>You're currently viewing as <strong>${escapeHtml(current)}</strong>. Switch to <strong>${escapeHtml(name)}</strong>?</p>`,
      actions: [
        { label: "Switch", primary: true, onClick: () => { localStorage.setItem("myTraveler_" + t.id, name); closeModal(); render(); } },
        { label: "Cancel", onClick: closeModal }
      ]
    });
    return;
  }
  if (current === name) {
    localStorage.removeItem("myTraveler_" + t.id);
  } else {
    localStorage.setItem("myTraveler_" + t.id, name);
  }
  render();
}
function showTravelerSelectModal(trip) {
  const travelers = trip.travelers || [];
  const chipsHtml = travelers.map(p => `
    <button class="btn" style="margin:4px 4px 4px 0;"
      onclick="selectTravelerFromModal('${escapeAttr(p)}', '${escapeAttr(trip.id)}')">
      ${escapeHtml(p)}
    </button>`).join("");
  showModal({
    title: "Who are you?",
    size: "sm",
    body: `<p style="margin-bottom:12px;color:var(--ink-soft);">Select your name to track your personal expense summary.</p>
      <div style="display:flex;flex-wrap:wrap;">${chipsHtml}</div>`,
    actions: [{ label: "Skip", onClick: closeModal }],
    dismissOnOverlay: false
  });
}
function selectTravelerFromModal(name, tripId) {
  localStorage.setItem("myTraveler_" + tripId, name);
  closeModal();
  render();
}
function computeMyData(t) {
  const me = getMyTraveler(t.id);
  if (!me) return null;
  const expenses = t.expenses || [];
  const travelers = t.travelers || [];
  let myOwed = 0, myPaid = 0, mySettled = 0, myUnsettled = 0;
  // Track net debts: positive = they owe me, negative = I owe them
  const netWith = {};
  travelers.forEach(p => { if (p !== me) netWith[p] = 0; });

  expenses.forEach(e => {
    const cost = parseFloat(e.cost) || 0;
    const participants = expenseParticipants(e, travelers);
    const payers = e.paidBy && e.paidBy.length ? e.paidBy : [];
    const isPayer = payers.includes(me);
    if (!participants.includes(me) && !isPayer) return;
    const split = computeSplit(e, travelers);
    const myShare = participants.includes(me) ? (split[me] || 0) : 0;
    myOwed += myShare;

    if (isPayer) myPaid += cost / payers.length;

    const settled = e.settledBy || [];
    const iHaveSettled = isPayer || settled.includes(me);
    if (iHaveSettled) mySettled += myShare;
    else myUnsettled += myShare;

    // Compute who owes whom, respecting settlements
    if (isPayer) {
      // I paid: only count participants who haven't settled with me yet
      participants.forEach(p => {
        if (p === me || netWith[p] === undefined) return;
        if (!payers.includes(p) && !settled.includes(p)) {
          netWith[p] += split[p] || 0;
        }
      });
    } else if (payers.length > 0 && !iHaveSettled) {
      // Someone else paid and I haven't settled: I still owe them
      payers.forEach(p => {
        if (p === me || netWith[p] === undefined) return;
        netWith[p] -= myShare / payers.length;
      });
    }
  });

  // Aggregate into owesMe / iOwe lists
  const owesMe = [], iOwe = [];
  Object.entries(netWith).forEach(([p, v]) => {
    if (v > 0.01) owesMe.push({ name: p, amount: v });
    else if (v < -0.01) iOwe.push({ name: p, amount: -v });
  });
  owesMe.sort((a, b) => b.amount - a.amount);
  iOwe.sort((a, b) => b.amount - a.amount);

  // Net balance: positive = owed to me, negative = I owe
  const net = Object.values(netWith).reduce((s, v) => s + v, 0);
  return { myOwed, myPaid, mySettled, myUnsettled, owesMe, iOwe, net };
}

Object.assign(window, {
  renderOverview,
  openGroupsModal, renderGroupsModal, dropTravelerIntoGroup,
  addGroup, renameGroup, deleteGroup,
  toggleTravEditMode, addTraveler, removeTraveler,
  getMyTraveler, setMyTraveler, computeMyData,
  showTravelerSelectModal, selectTravelerFromModal,
});

