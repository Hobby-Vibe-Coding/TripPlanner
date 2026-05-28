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


const EXPENSE_CATEGORIES = ["Transport","Lodging","Activities","Food","Shopping","Misc"];
const SPLIT_METHODS = [
  { id: "equal", label: "Equal", icon: "=", desc: "Each traveler pays the same amount. Use when everyone benefited equally." },
  { id: "exact", label: "Exact", icon: "1.23", desc: "Each traveler pays a fixed dollar amount you enter directly. Use when you've already worked out who owes what." },
  { id: "percent", label: "Percent", icon: "%", desc: "Each traveler pays a percentage of the bill (must total 100%). Use for fixed long-term ratios." },
  { id: "shares", label: "Shares", icon: "\u2261", desc: "Each traveler pays in proportion to assigned shares. Use when one traveler owes 2\u00d7 another, etc." },
  { id: "adjust", label: "Adjust", icon: "+/\u2212", desc: "Equal split, then add or subtract a dollar amount per traveler. Use for one-off favors or fines." },
];

// -------- EXPENSES SEARCH / PAGINATION STATE --------
let expensePage = 0;
let expensePageSize = 10;
let expenseSearch = "";
function setExpensePage(page) { expensePage = page; render(); }
function setExpensePageSize(size) { expensePageSize = parseInt(size); expensePage = 0; render(); }
function setExpenseSearch(query) {
  expenseSearch = query;
  expensePage = 0;
  render();
  const el = document.getElementById("expense-search");
  if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}

// -------- EXPENSE SPLIT LOGIC --------
function expenseParticipants(e, allTravelers) {
  // splitAmong: undefined = all travelers; [] = none; otherwise specific names
  if (!e.splitAmong) return allTravelers.slice();
  return e.splitAmong.filter(p => allTravelers.includes(p));
}

function computeSplit(expense, allTravelers) {
  const cost = parseFloat(expense.cost) || 0;
  const participants = expenseParticipants(expense, allTravelers);
  const result = {};
  if (!participants.length) return result;
  const method = expense.splitMethod || "equal";
  const d = expense.splitDetails || {};

  if (method === "equal") {
    const each = cost / participants.length;
    participants.forEach(p => result[p] = each);
  } else if (method === "exact") {
    participants.forEach(p => result[p] = parseFloat(d[p]) || 0);
  } else if (method === "percent") {
    participants.forEach(p => result[p] = cost * (parseFloat(d[p]) || 0) / 100);
  } else if (method === "shares" || method === "days") {
    let total = 0;
    participants.forEach(p => total += (parseFloat(d[p]) || 0));
    if (total <= 0) {
      const each = cost / participants.length;
      participants.forEach(p => result[p] = each);
    } else {
      participants.forEach(p => result[p] = cost * (parseFloat(d[p]) || 0) / total);
    }
  } else if (method === "adjust") {
    let totalAdj = 0;
    participants.forEach(p => totalAdj += (parseFloat(d[p]) || 0));
    const base = (cost - totalAdj) / participants.length;
    participants.forEach(p => result[p] = base + (parseFloat(d[p]) || 0));
  }
  return result;
}

function splitTotalAllocated(expense, allTravelers) {
  const split = computeSplit(expense, allTravelers);
  return Object.values(split).reduce((s, v) => s + (v || 0), 0);
}

function splitSummaryLabel(expense, allTravelers) {
  const m = SPLIT_METHODS.find(x => x.id === (expense.splitMethod||"equal")) || SPLIT_METHODS[0];
  const ppl = expenseParticipants(expense, allTravelers).length;
  return `${m.icon} ${m.label} · ${ppl} ${ppl===1?"person":"ppl"}`;
}

// -------- EXPENSES TAB --------
function renderExpenses(t, printMode) {
  const expenses = t.expenses || [];
  const travelers = t.travelers || [];
  const me = getMyTraveler(t.id);

  // Filter to expenses involving the selected traveler (keep original index for mutations)
  const visibleWithIdx = expenses.map((e, i) => ({ e, i })).filter(({ e }) => {
    if (!me) return true;
    return (e.paidBy || []).includes(me) || expenseParticipants(e, travelers).includes(me);
  });

  // Apply search filter across name, category, paidBy, note
  const q = expenseSearch.toLowerCase().trim();
  const searchFiltered = q ? visibleWithIdx.filter(({ e }) =>
    (e.name||"").toLowerCase().includes(q)
    || (e.category||"").toLowerCase().includes(q)
    || (e.note||"").toLowerCase().includes(q)
    || (e.paidBy||[]).some(p => p.toLowerCase().includes(q))
  ) : visibleWithIdx;

  // Pagination (skip in print mode)
  const totalPages = (!printMode && expensePageSize > 0) ? Math.max(1, Math.ceil(searchFiltered.length / expensePageSize)) : 1;
  const safePage = Math.min(expensePage, totalPages - 1);
  const pageStart = printMode ? 0 : safePage * expensePageSize;
  const pageEnd = printMode ? searchFiltered.length : pageStart + expensePageSize;
  const pagedItems = searchFiltered.slice(pageStart, pageEnd);

  const total = searchFiltered.reduce((s, { e }) => s + (parseFloat(e.cost) || 0), 0);

  // Aggregate owed/paid/settled using computeSplit logic
  const owedBy = {}; const paidBy = {}; const settledAmt = {}; const unsettledAmt = {}; const unsettledToMe = {};
  travelers.forEach(p => { owedBy[p] = 0; paidBy[p] = 0; settledAmt[p] = 0; unsettledAmt[p] = 0; unsettledToMe[p] = 0; });
  expenses.forEach(e => {
    const cost = parseFloat(e.cost) || 0;
    const split = computeSplit(e, travelers);
    Object.entries(split).forEach(([p, v]) => { if (owedBy[p] !== undefined) owedBy[p] += v; });
    const payer = e.paidBy && e.paidBy.length ? e.paidBy : (travelers[0] ? [travelers[0]] : []);
    if (payer.length) payer.forEach(p => { if (paidBy[p] !== undefined) paidBy[p] += cost / payer.length; });
    // Track settlements — from debtor's perspective
    const settled = e.settledBy || [];
    const participants = expenseParticipants(e, travelers);
    participants.forEach(p => {
      const share = split[p] || 0;
      if (payer.includes(p)) { settledAmt[p] += share; }
      else if (settled.includes(p)) { settledAmt[p] += share; }
      else { unsettledAmt[p] += share; }
    });
    // Track settlements — from creditor's perspective (amount still owed TO each payer)
    participants.forEach(other => {
      if (!payer.includes(other) && !settled.includes(other)) {
        const share = (split[other] || 0) / payer.length;
        payer.forEach(pp => { if (unsettledToMe[pp] !== undefined) unsettledToMe[pp] += share; });
      }
    });
  });

  const rows = pagedItems.map(({ e, i }) => {
    const allocated = splitTotalAllocated(e, travelers);
    const cost = parseFloat(e.cost) || 0;
    const balanced = Math.abs(allocated - cost) < 0.01;
    const participants = travelers.length ? expenseParticipants(e, travelers) : [];
    const perPerson = participants.length > 0 ? cost / participants.length : 0;
    const method = e.splitMethod || "equal";
    const isCustom = method !== "equal" || (e.splitAmong && e.splitAmong.length > 0 && e.splitAmong.length < travelers.length);
    const splitLabel = isCustom
      ? `${fmtCurrency(perPerson)} avg · ${participants.length} ppl`
      : (participants.length > 0 ? fmtCurrency(perPerson) : "$0.00");
    return `
    <tr>
      <td class="col-name"><input value="${escapeHtml(e.name||"")}" onchange="updateExpense(${i},'name',this.value)" placeholder="Expense" /></td>
      <td class="col-cat"><select onchange="updateExpense(${i},'category',this.value)">
        ${EXPENSE_CATEGORIES.map(c => `<option ${e.category===c?"selected":""}>${c}</option>`).join("")}
      </select></td>
      <td class="col-cost num"><input type="number" step="0.01" value="${e.cost||""}" onchange="updateExpense(${i},'cost',parseFloat(this.value)||0)" /></td>
      <td class="col-date"><input type="date" value="${e.date||""}" onchange="updateExpense(${i},'date',this.value)" /></td>
      <td class="col-paid">
        <button class="payer-btn" onclick="openPayerDialog(${i})" title="Select who paid & settle up">
          ${(e.paidBy||[]).length ? (e.paidBy||[]).map(p => `<span class="payer-tag">${escapeHtml(p)}</span>`).join("") : '<span class="payer-placeholder">Select payer</span>'}
          ${(() => {
            const parts = travelers.length ? expenseParticipants(e, travelers) : [];
            const payers = (e.paidBy||[]);
            const settled = (e.settledBy||[]);
            const needSettle = parts.filter(p => !payers.includes(p));
            const doneCount = needSettle.filter(p => settled.includes(p)).length;
            return needSettle.length > 0 && payers.length > 0
              ? '<span style="font-size:10px;color:' + (doneCount === needSettle.length ? '#2e7d32' : 'var(--ink-soft)') + ';margin-left:2px;">' + doneCount + '/' + needSettle.length + '</span>'
              : '';
          })()}
        </button>
      </td>
      <td class="col-note"><input value="${escapeHtml(e.note||"")}" onchange="updateExpense(${i},'note',this.value)" placeholder="" /></td>
      <td class="col-per">
        <button class="split-cell-btn" onclick="openSplitEditor(${i})" title="Customize split">
          ${splitLabel} ${!balanced && cost>0 ? '<span style="color:#c0392b;" title="Allocation doesn\'t match cost">⚠</span>' : ''}
        </button>
      </td>
      <td class="row-actions no-print">
        <button class="icon-btn" onclick="deleteExpense(${i})" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </td>
    </tr>
  `;}).join("");

  return `
    <div class="panel">
      <div class="panel-head">
        <h3>Expenses</h3>
        <div class="actions">
          <button class="btn sm" onclick="openCalc()" title="Calculator">🧮 Calculator</button>
          <button class="btn sm primary" onclick="addExpense()">+ Add expense</button>
        </div>
      </div>

      ${expenses.length > 0 ? `
        <div class="no-print" style="display:flex;align-items:center;margin-bottom:15px;">
          <div style="flex:8;position:relative;">
            <svg style="position:absolute;left:9px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink-soft);pointer-events:none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="expense-search" type="text" placeholder="Search by name, category, payer…"
              value="${escapeHtml(expenseSearch)}"
              oninput="setExpenseSearch(this.value)"
              style="width:100%;padding:7px 10px 7px 30px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px;background:var(--surface-2);box-sizing:border-box;" />
            ${expenseSearch ? `<button onclick="setExpenseSearch('')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-soft);font-size:16px;line-height:1;padding:0;" title="Clear">×</button>` : ''}
          </div>
          <div style="flex:2;"></div>
          <div style="flex:2;display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:13px;color:var(--ink-soft);white-space:nowrap;">
            Rows per page:
            <select onchange="setExpensePageSize(this.value)" style="padding:3px 6px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:13px;background:var(--surface-2);">
              ${[5,10,15,20].map(n => `<option value="${n}" ${expensePageSize===n?'selected':''}>${n}</option>`).join('')}
            </select>
          </div>
        </div>
      ` : ''}

      ${expenses.length === 0 ? `
        <div class="empty-mini">
          <h4>No expenses yet 💸</h4>
          <p>Add your flights, lodging, activities — anything you're spending on this trip.</p>
          <button class="btn primary sm" onclick="addExpense()" style="margin-top:8px;">+ Add first expense</button>
        </div>
      ` : `
        <div class="t-wrap">
          <table class="t">
            <thead><tr>
              <th class="col-name">Expense</th><th class="col-cat">Category</th><th class="col-cost" style="text-align:right;">Cost</th>
              <th class="col-date">Date</th><th class="col-paid">Paid by</th><th class="col-note">Note</th><th class="col-per">Per Person</th>
              <th class="no-print"></th>
            </tr></thead>
            <tbody>${rows || `<tr><td colspan="8" style="padding:20px 12px;color:var(--ink-soft);text-align:center;">${q ? `No expenses match "<strong>${escapeHtml(expenseSearch)}</strong>".` : `No expenses involve <strong>${escapeHtml(me)}</strong> yet.`}</td></tr>`}</tbody>
            <tfoot>
              <tr>
                <td colspan="2">Total</td>
                <td class="num">${fmtCurrency(total)}</td>
                <td colspan="4"></td>
                <td class="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${!printMode && searchFiltered.length > 0 ? `
        <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:13px;">
          <div style="color:var(--ink-soft);">
            ${(() => {
              const parts = [];
              if (q) parts.push(`matching "<strong>${escapeHtml(expenseSearch)}</strong>"`);
              if (me) parts.push(`involving <strong>${escapeHtml(me)}</strong>`);
              const count = searchFiltered.length;
              return `Showing ${count} expense${count !== 1 ? 's' : ''}${parts.length ? ' ' + parts.join(' and ') : ''}.`
                + (me ? ` <span style="font-size:11px;">(Tap your name in Overview to clear.)</span>` : '');
            })()}
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="color:var(--ink-soft);margin-right:4px;">Page ${safePage+1} of ${totalPages}</span>
            <button class="btn sm" onclick="setExpensePage(${safePage-1})" ${safePage===0?'disabled':''} style="min-width:32px;">‹</button>
            ${Array.from({length:totalPages},(_,k)=>k).filter(k=>Math.abs(k-safePage)<=2||k===0||k===totalPages-1).reduce((acc,k,idx,arr)=>{
              if(idx>0&&k-arr[idx-1]>1) acc.push('<span style="color:var(--ink-soft);padding:0 2px;">…</span>');
              acc.push(`<button class="btn sm ${k===safePage?'primary':''}" onclick="setExpensePage(${k})" style="min-width:32px;">${k+1}</button>`);
              return acc;
            },[]).join('')}
            <button class="btn sm" onclick="setExpensePage(${safePage+1})" ${safePage===totalPages-1?'disabled':''} style="min-width:32px;">›</button>
          </div>
        </div>` : ''}

        ${travelers.length >= 1 ? `
          <h4 style="margin:18px 0 0; margin-bottom: 18px;">Per-person breakdown</h4>
          <div class="panel-sub">Compares each person's share of expenses vs. what they've paid. Click a person to see their expense details.</div>
          <div class="split-summary">
            ${travelers.map(p => {
              const owe = owedBy[p] || 0, paid = paidBy[p] || 0, net = paid - owe;
              const color = net > 0.01 ? "var(--primary)" : net < -0.01 ? "#c0392b" : "var(--ink-soft)";
              const uAmt = unsettledAmt[p] || 0, uToMe = unsettledToMe[p] || 0;
              const hasActivity = owe > 0;
              const isCreditor = net > 0.01, isDebtor = net < -0.01;
              const allSettled = isCreditor ? uToMe < 0.01 : (isDebtor ? uAmt < 0.01 : false);
              const unsettledLabel = isCreditor
                ? (uToMe > 0.01 ? `${fmtCurrency(uToMe)} unsettled` : '')
                : (uAmt > 0.01 ? `${fmtCurrency(uAmt)} unsettled` : '');
              return `
                <div class="split-pill" onclick="openPersonDetail('${escapeAttr(p)}')" title="Click to see ${escapeHtml(p)}'s expenses">
                  <div class="who">${escapeHtml(p)}</div>
                  <div class="amt">${fmtCurrency(owe)}</div>
                  <div class="text-sm" style="color:${color};margin-top:2px;">
                    ${isCreditor ? "Is owed " + fmtCurrency(net) : isDebtor ? "Owes " + fmtCurrency(-net) : "Even"}
                  </div>
                  ${hasActivity && unsettledLabel ? `<div class="text-sm" style="color:#c0392b;margin-top:1px;font-size:10px;">${unsettledLabel}</div>` : ''}
                  ${hasActivity && allSettled ? `<div class="text-sm" style="color:#2e7d32;margin-top:1px;font-size:10px;">✓ All settled</div>` : ''}
                </div>
              `;
            }).join("")}
          </div>
        ` : `<div class="hint" style="margin-top:14px;">Add travelers (in Overview tab) to see per-person breakdowns.</div>`}
      `}
    </div>
  `;
}

// -------- SPLIT EDITOR --------
function openSplitEditor(i) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  const travelers = t.travelers || [];
  if (!travelers.length) {
    alert("Add travelers first (in the Overview tab) so you can split this expense.");
    return;
  }
  const e = t.expenses[i];
  // Ensure splitAmong defaults to all travelers if undefined
  if (!e.splitAmong) e.splitAmong = travelers.slice();
  e.splitMethod = e.splitMethod || "equal";
  e.splitDetails = e.splitDetails || {};

  showModal({
    title: `Split: ${e.name || "Expense"} (${fmtCurrency(parseFloat(e.cost)||0)})`,
    size: "lg",
    body: `<div id="split-editor-body"></div>`,
    actions: [
      { label: "Done", primary: true, onClick: () => { saveState(); closeModal(); render(); } }
    ]
  });
  renderSplitEditor(i);
}

function renderSplitEditor(i) {
  const t = currentTrip();
  const e = t.expenses[i];
  const allTravelers = t.travelers || [];
  const participants = expenseParticipants(e, allTravelers);
  const cost = parseFloat(e.cost) || 0;
  const method = e.splitMethod || "equal";
  const methodObj = SPLIT_METHODS.find(m => m.id === method) || SPLIT_METHODS[0];
  const split = computeSplit(e, allTravelers);
  const allocated = Object.values(split).reduce((s,v)=>s+(v||0), 0);
  const balanced = Math.abs(allocated - cost) < 0.01;

  // Method-specific rows
  let rowsHtml = "";
  let headHtml = "";
  if (!participants.length) {
    rowsHtml = `<div style="padding:24px;text-align:center;color:var(--ink-soft);">Select at least one traveler above.</div>`;
  } else if (method === "equal") {
    headHtml = `<div class="split-row-head cols-2"><div>Traveler</div><div style="text-align:right;">Amount</div></div>`;
    rowsHtml = participants.map(p => `
      <div class="split-row cols-2">
        <div class="who">${escapeHtml(p)}</div>
        <div class="amt-out" style="text-align:right;">${fmtCurrency(split[p]||0)}</div>
      </div>
    `).join("");
  } else if (method === "exact") {
    headHtml = `<div class="split-row-head cols-2"><div>Traveler</div><div style="text-align:right;">Amount (${state.settings.currency})</div></div>`;
    rowsHtml = participants.map(p => `
      <div class="split-row cols-2">
        <div class="who">${escapeHtml(p)}</div>
        <input class="split-in" type="number" step="0.01" value="${(e.splitDetails[p]!==undefined?e.splitDetails[p]:(split[p]||0).toFixed(2))}"
               onchange="updateSplitDetail(${i}, '${escapeAttr(p)}', this.value)" style="max-width:140px;margin-left:auto;display:block;text-align:right;"/>
      </div>
    `).join("");
  } else if (method === "percent") {
    headHtml = `<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Percent</div><div style="text-align:right;">Amount</div></div>`;
    rowsHtml = participants.map(p => {
      const pct = e.splitDetails[p]!==undefined ? e.splitDetails[p] : (100/participants.length).toFixed(2);
      return `
      <div class="split-row cols-3">
        <div class="who">${escapeHtml(p)}</div>
        <div><input class="split-in" type="number" step="0.01" value="${pct}"
                onchange="updateSplitDetail(${i}, '${escapeAttr(p)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${fmtCurrency(split[p]||0)}</div>
      </div>
    `;}).join("");
  } else if (method === "shares") {
    headHtml = `<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Shares</div><div style="text-align:right;">Amount</div></div>`;
    rowsHtml = participants.map(p => {
      const sh = e.splitDetails[p]!==undefined ? e.splitDetails[p] : 1;
      return `
      <div class="split-row cols-3">
        <div class="who">${escapeHtml(p)}</div>
        <div><input class="split-in" type="number" step="1" min="0" value="${sh}"
                onchange="updateSplitDetail(${i}, '${escapeAttr(p)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${fmtCurrency(split[p]||0)}</div>
      </div>
    `;}).join("");
  } else if (method === "days") {
    headHtml = `<div class="split-row-head cols-3"><div>Traveler</div><div style="text-align:right;">Days</div><div style="text-align:right;">Amount</div></div>`;
    const tripDays = tripDuration(t) || 1;
    rowsHtml = participants.map(p => {
      const dv = e.splitDetails[p]!==undefined ? e.splitDetails[p] : tripDays;
      return `
      <div class="split-row cols-3">
        <div class="who">${escapeHtml(p)}</div>
        <div><input class="split-in" type="number" step="1" min="0" value="${dv}"
                onchange="updateSplitDetail(${i}, '${escapeAttr(p)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${fmtCurrency(split[p]||0)}</div>
      </div>
    `;}).join("");
  } else if (method === "adjust") {
    headHtml = `<div class="split-row-head cols-4"><div>Traveler</div><div style="text-align:right;">Equal share</div><div style="text-align:right;">Adjustment</div><div style="text-align:right;">Final</div></div>`;
    const totalAdj = participants.reduce((s,p)=>s+(parseFloat(e.splitDetails[p])||0), 0);
    const baseShare = (cost - totalAdj) / participants.length;
    rowsHtml = participants.map(p => {
      const adj = e.splitDetails[p]!==undefined ? e.splitDetails[p] : 0;
      return `
      <div class="split-row cols-4">
        <div class="who">${escapeHtml(p)}</div>
        <div class="amt-out muted-out" style="text-align:right;">${fmtCurrency(baseShare)}</div>
        <div class="adj-wrap"><input class="split-in adj" type="number" step="0.01" value="${adj}"
                onchange="updateSplitDetail(${i}, '${escapeAttr(p)}', this.value)" style="text-align:right;"/></div>
        <div class="amt-out" style="text-align:right;">${fmtCurrency(split[p]||0)}</div>
      </div>
    `;}).join("");
  }

  // Method-specific footer
  let footerHtml = "";
  if (method === "percent") {
    const totalPct = participants.reduce((s,p)=>s + (parseFloat(e.splitDetails[p])||0), 0);
    const pctOk = Math.abs(totalPct - 100) < 0.01;
    footerHtml = `<div class="split-summary-line">
      <div>Total: <span class="${pctOk?'ok':'bad'}">${totalPct.toFixed(2)}%</span></div>
      <div>${fmtCurrency(allocated)} ${balanced ? '<span class="ok">✓ Fully allocated</span>' : `<span class="bad">≠ ${fmtCurrency(cost)}</span>`}</div>
    </div>`;
  } else if (method === "shares") {
    const totalShares = participants.reduce((s,p)=>s + (parseFloat(e.splitDetails[p])||0), 0);
    footerHtml = `<div class="split-summary-line">
      <div>Total shares: ${totalShares}</div>
      <div>${fmtCurrency(allocated)} ${balanced ? '<span class="ok">✓ Fully allocated</span>' : `<span class="bad">≠ ${fmtCurrency(cost)}</span>`}</div>
    </div>`;
  } else if (method === "days") {
    const totalDays = participants.reduce((s,p)=>s + (parseFloat(e.splitDetails[p])||0), 0);
    footerHtml = `<div class="split-summary-line">
      <div>Total person-days: ${totalDays}</div>
      <div>${fmtCurrency(allocated)} ${balanced ? '<span class="ok">✓ Fully allocated</span>' : `<span class="bad">≠ ${fmtCurrency(cost)}</span>`}</div>
    </div>`;
  } else {
    footerHtml = `<div class="split-summary-line">
      <div>Total: <strong>${fmtCurrency(allocated)}</strong></div>
      <div>${balanced ? '<span class="ok">✓ Fully allocated</span>' : `<span class="bad">${fmtCurrency(allocated-cost>0?allocated-cost:cost-allocated)} ${allocated>cost?"over":"short"}</span>`}</div>
    </div>`;
  }

  const html = `
    <div class="field">
      <label>Split method</label>
      <div class="split-methods">
        ${SPLIT_METHODS.map(m => `
          <button class="split-method ${method===m.id?'sel':''}" onclick="changeSplitMethod(${i}, '${m.id}')">
            <div class="sm-icon">${m.icon}</div>
            <div class="sm-label">${m.label}</div>
          </button>
        `).join("")}
      </div>
      <div class="split-desc">${methodObj.desc}</div>
    </div>

    <div class="field">
      <label>Who's involved? (${participants.length} of ${allTravelers.length})</label>
      ${(() => {
        const groups = (t.groups || []).filter(g => g.members.filter(p => allTravelers.includes(p)).length > 0);
        if (!groups.length) return "";
        return `<div class="split-group-row">
          ${groups.map(g => {
            const members = g.members.filter(p => allTravelers.includes(p));
            const allOn = members.every(p => (e.splitAmong || allTravelers).includes(p));
            const groupIdx = (t.groups || []).indexOf(g);
            return `<button class="group-chip-btn ${allOn?'selected':''}"
              onclick="toggleGroupParticipants(${i}, ${groupIdx})">
              ${escapeHtml(g.name)} <span style="opacity:0.7;font-weight:400;">${members.length}</span>
            </button>`;
          }).join("")}
        </div>`;
      })()}
      <div class="split-participants">
        ${allTravelers.map(p => {
          const on = (e.splitAmong || allTravelers).includes(p);
          return `
            <label class="split-chip ${on?'on':''}" onclick="toggleSplitParticipant(${i}, '${escapeAttr(p)}')">
              <div class="dot"></div> ${escapeHtml(p)}
            </label>
          `;
        }).join("")}
        <button class="split-chip" style="background:transparent;font-weight:600;color:var(--primary);"
                onclick="setAllSplitParticipants(${i}, ${participants.length === allTravelers.length})">
          ${participants.length === allTravelers.length ? "Clear all" : "Select all"}
        </button>
      </div>
    </div>

    <div class="field">
      <label>Allocation</label>
      <div class="split-rows">
        ${headHtml}
        ${rowsHtml}
      </div>
      ${footerHtml}
      ${method !== "equal" && participants.length ? `
        <div style="margin-top:8px;display:flex;justify-content:flex-end;">
          <button class="btn sm" onclick="splitAutoBalance(${i})">⚖ Auto-balance</button>
        </div>
      ` : ""}
    </div>
  `;
  document.getElementById("split-editor-body").innerHTML = html;
}

// escapeAttr provided by the bridge above (window.escapeAttr from utils.js)

function changeSplitMethod(i, method) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.splitMethod = method;
  // Reset details to sensible defaults
  const participants = expenseParticipants(e, t.travelers || []);
  e.splitDetails = {};
  if (method === "percent") {
    const each = participants.length ? 100/participants.length : 0;
    participants.forEach(p => e.splitDetails[p] = parseFloat(each.toFixed(2)));
  } else if (method === "shares") {
    participants.forEach(p => e.splitDetails[p] = 1);
  } else if (method === "days") {
    const td = tripDuration(t) || 1;
    participants.forEach(p => e.splitDetails[p] = td);
  } else if (method === "adjust") {
    participants.forEach(p => e.splitDetails[p] = 0);
  } else if (method === "exact") {
    const cost = parseFloat(e.cost) || 0;
    const each = participants.length ? cost/participants.length : 0;
    participants.forEach(p => e.splitDetails[p] = parseFloat(each.toFixed(2)));
  }
  saveState();
  renderSplitEditor(i);
}

function updateSplitDetail(i, name, value) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.splitDetails = e.splitDetails || {};
  e.splitDetails[name] = parseFloat(value) || 0;
  saveState();
  renderSplitEditor(i);
}

function toggleSplitParticipant(i, name) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.splitAmong = e.splitAmong || (t.travelers || []).slice();
  const idx = e.splitAmong.indexOf(name);
  if (idx >= 0) e.splitAmong.splice(idx, 1); else e.splitAmong.push(name);
  // Clean up details for removed participants
  if (e.splitDetails) { Object.keys(e.splitDetails).forEach(k => { if (!e.splitAmong.includes(k)) delete e.splitDetails[k]; }); }
  saveState();
  renderSplitEditor(i);
}

function setAllSplitParticipants(i, clear) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.splitAmong = clear ? [] : (t.travelers || []).slice();
  saveState();
  renderSplitEditor(i);
}

function toggleGroupParticipants(i, groupIdx) {
  const t = currentTrip();
  const e = t.expenses[i];
  const travelers = t.travelers || [];
  const group = (t.groups || [])[groupIdx];
  if (!group) return;
  const members = group.members.filter(p => travelers.includes(p));
  e.splitAmong = e.splitAmong || travelers.slice();
  const allOn = members.every(p => e.splitAmong.includes(p));
  if (allOn) {
    e.splitAmong = e.splitAmong.filter(p => !members.includes(p));
  } else {
    members.forEach(p => { if (!e.splitAmong.includes(p)) e.splitAmong.push(p); });
  }
  if (e.splitDetails) { Object.keys(e.splitDetails).forEach(k => { if (!e.splitAmong.includes(k)) delete e.splitDetails[k]; }); }
  saveState();
  renderSplitEditor(i);
}

function splitAutoBalance(i) {
  // Adjust last participant's value so total matches cost
  const t = currentTrip();
  const e = t.expenses[i];
  const cost = parseFloat(e.cost) || 0;
  const participants = expenseParticipants(e, t.travelers || []);
  if (!participants.length) return;
  const method = e.splitMethod;

  if (method === "percent") {
    const last = participants[participants.length - 1];
    let used = 0;
    for (let j = 0; j < participants.length - 1; j++) {
      used += parseFloat(e.splitDetails[participants[j]]) || 0;
    }
    e.splitDetails[last] = parseFloat((100 - used).toFixed(2));
  } else if (method === "exact") {
    const last = participants[participants.length - 1];
    let used = 0;
    for (let j = 0; j < participants.length - 1; j++) {
      used += parseFloat(e.splitDetails[participants[j]]) || 0;
    }
    e.splitDetails[last] = parseFloat((cost - used).toFixed(2));
  } else if (method === "adjust") {
    // zero out adjustments
    participants.forEach(p => e.splitDetails[p] = 0);
  } else if (method === "shares" || method === "days") {
    // Already auto-balances proportionally
  }
  saveState();
  renderSplitEditor(i);
}

// -------- PAYER & SETTLE-UP DIALOG --------
function openPayerDialog(i) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  const travelers = t.travelers || [];
  if (!travelers.length) {
    alert("Add travelers first (in the Overview tab).");
    return;
  }
  const e = t.expenses[i];
  e.paidBy = e.paidBy || [];
  e.settledBy = e.settledBy || [];

  showModal({
    title: `Payment: ${e.name || "Expense"} (${fmtCurrency(parseFloat(e.cost)||0)})`,
    size: "lg",
    body: `<div id="payer-dialog-body"></div>`,
    actions: [
      { label: "Done", primary: true, onClick: () => { saveState(); closeModal(); render(); } }
    ]
  });
  renderPayerDialog(i);
}

function renderPayerDialog(i) {
  const t = currentTrip();
  const e = t.expenses[i];
  const travelers = t.travelers || [];
  const participants = expenseParticipants(e, travelers);
  const cost = parseFloat(e.cost) || 0;
  const split = computeSplit(e, travelers);
  const payers = e.paidBy || [];
  const settled = e.settledBy || [];

  // Payer selection
  const payerChips = travelers.map(p => {
    const on = payers.includes(p);
    return `<div class="settle-payer-chip ${on?'on':''}" onclick="dialogTogglePayer(${i}, '${escapeAttr(p)}')">
      <div class="chip-dot"></div> ${escapeHtml(p)}
    </div>`;
  }).join("");

  // Settle-up rows: participants who didn't pay need to settle
  let settleHtml = "";
  if (payers.length > 0 && participants.length > 0) {
    const settleRows = participants.map(p => {
      const share = split[p] || 0;
      const isPayer = payers.includes(p);
      const isSettled = settled.includes(p);

      let toggleHtml;
      if (isPayer) {
        toggleHtml = `<div class="settle-toggle is-payer">Payer</div>`;
      } else {
        toggleHtml = `<div class="settle-toggle ${isSettled?'settled':''}" onclick="dialogToggleSettle(${i}, '${escapeAttr(p)}')">
          ${isSettled ? '✓ Settled' : 'Unsettled'}
        </div>`;
      }
      return `<div class="settle-row">
        <div class="settle-name">${escapeHtml(p)}</div>
        <div class="settle-amt">${fmtCurrency(share)}</div>
        ${toggleHtml}
      </div>`;
    }).join("");

    const needSettle = participants.filter(p => !payers.includes(p));
    const doneCount = needSettle.filter(p => settled.includes(p)).length;
    const totalUnsettled = needSettle.filter(p => !settled.includes(p)).reduce((s, p) => s + (split[p]||0), 0);

    settleHtml = `
      <div class="settle-section">
        <div class="settle-section-label">Settle up</div>
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:10px;">
          Mark participants as settled once they've paid back the payer${payers.length > 1 ? 's' : ''}.
        </div>
        <div class="settle-rows">${settleRows}</div>
        <div class="settle-summary">
          <span>${doneCount}/${needSettle.length} settled</span>
          <span style="color:${totalUnsettled > 0.01 ? '#c0392b' : '#2e7d32'}">
            ${totalUnsettled > 0.01 ? fmtCurrency(totalUnsettled) + ' unsettled' : '✓ All settled'}
          </span>
        </div>
      </div>
    `;
  } else if (payers.length === 0) {
    settleHtml = `<div style="padding:16px;text-align:center;color:var(--ink-soft);font-size:13px;">Select who paid above to track settlements.</div>`;
  }

  document.getElementById("payer-dialog-body").innerHTML = `
    <div class="settle-section">
      <div class="settle-section-label">Who paid?</div>
      <div style="font-size:12px;color:var(--ink-soft);margin-bottom:8px;">Select the person(s) who paid for this expense upfront.</div>
      <div class="settle-payer-chips">${payerChips}</div>
    </div>
    ${settleHtml}
  `;
}

function dialogTogglePayer(i, name) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.paidBy = e.paidBy || [];
  const idx = e.paidBy.indexOf(name);
  if (idx >= 0) e.paidBy.splice(idx, 1); else e.paidBy.push(name);
  // If removed as payer, also remove from settled
  if (idx >= 0 && e.settledBy) {
    const si = e.settledBy.indexOf(name);
    if (si >= 0) e.settledBy.splice(si, 1);
  }
  saveState();
  renderPayerDialog(i);
}

function dialogToggleSettle(i, name) {
  const t = currentTrip();
  const e = t.expenses[i];
  e.settledBy = e.settledBy || [];
  const idx = e.settledBy.indexOf(name);
  if (idx >= 0) e.settledBy.splice(idx, 1); else e.settledBy.push(name);
  saveState();
  renderPayerDialog(i);
}

function settleWithPerson(otherName) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const me = getMyTraveler(t.id);
  if (!me) return;
  const travelers = t.travelers || [];
  showModal({
    title: `Settle up with ${escapeHtml(otherName)}?`,
    size: 'sm',
    body: `<p>Mark all outstanding expenses between <strong>${escapeHtml(me)}</strong> and <strong>${escapeHtml(otherName)}</strong> as settled — in both directions.</p>`,
    actions: [
      { label: 'Settle all', primary: true, onClick: () => {
        let changed = false;
        (t.expenses || []).forEach(e => {
          const payers = e.paidBy && e.paidBy.length ? e.paidBy : [];
          const parts = expenseParticipants(e, travelers);
          if (payers.includes(otherName) && parts.includes(me) && !payers.includes(me) && !(e.settledBy||[]).includes(me)) {
            e.settledBy = [...(e.settledBy||[]), me]; changed = true;
          }
          if (payers.includes(me) && parts.includes(otherName) && !payers.includes(otherName) && !(e.settledBy||[]).includes(otherName)) {
            e.settledBy = [...(e.settledBy||[]), otherName]; changed = true;
          }
        });
        if (changed) saveState();
        closeModal(); render();
      }},
      { label: 'Cancel', onClick: closeModal }
    ]
  });
}
function settleOneDebt(expenseIdx, nameToSettle) {
  if (!guardEdit()) return;
  const t = currentTrip();
  const e = t.expenses[expenseIdx];
  if (!e) return;
  e.settledBy = e.settledBy || [];
  if (!e.settledBy.includes(nameToSettle)) {
    e.settledBy.push(nameToSettle);
    saveState(); render();
  }
}
function buildDetailedDebts(t) {
  const me = getMyTraveler(t.id);
  if (!me) return { owesMe: [], iOwe: [] };
  const travelers = t.travelers || [];
  const owesMe = [], iOwe = [];
  (t.expenses || []).forEach((e, i) => {
    const cost = parseFloat(e.cost) || 0;
    if (!cost) return;
    const payers = e.paidBy && e.paidBy.length ? e.paidBy : [];
    const parts = expenseParticipants(e, travelers);
    const split = computeSplit(e, travelers);
    const settled = e.settledBy || [];
    if (payers.includes(me)) {
      parts.forEach(p => {
        if (p === me || payers.includes(p) || settled.includes(p)) return;
        owesMe.push({ name: p, amount: split[p] || 0, expenseIdx: i, expenseName: e.name || 'Untitled' });
      });
    }
    if (!payers.includes(me) && parts.includes(me) && !settled.includes(me)) {
      payers.forEach(p => {
        iOwe.push({ name: p, amount: (split[me] || 0) / payers.length, expenseIdx: i, expenseName: e.name || 'Untitled' });
      });
    }
  });
  return { owesMe, iOwe };
}

// -------- PERSON EXPENSE DETAIL --------
function openPersonDetail(name) {
  const t = currentTrip(); if (!t) return;
  const expenses = t.expenses || [];
  const travelers = t.travelers || [];

  // Find all expenses this person is involved in
  const personExpenses = [];
  let totalOwed = 0, totalPaid = 0, totalSettled = 0, totalUnsettled = 0;
  let outstandingFromOthers = 0;

  expenses.forEach((e, i) => {
    const cost = parseFloat(e.cost) || 0;
    const participants = expenseParticipants(e, travelers);
    const payers = e.paidBy && e.paidBy.length ? e.paidBy : (travelers[0] ? [travelers[0]] : []);
    const isPayer = payers.includes(name);
    if (!participants.includes(name) && !isPayer) return;

    const split = computeSplit(e, travelers);
    const share = participants.includes(name) ? (split[name] || 0) : 0;
    totalOwed += share;

    let paidAmount = 0;
    if (isPayer) {
      paidAmount = cost / payers.length;
    }
    totalPaid += paidAmount;

    // Settlement status
    const isSettled = (e.settledBy || []).includes(name);
    let status, settledCount = 0, debtorCount = 0;
    if (isPayer) {
      const debtors = participants.filter(p => !payers.includes(p));
      debtorCount = debtors.length;
      settledCount = debtors.filter(p => (e.settledBy || []).includes(p)).length;
      status = debtorCount === 0 ? "payer-solo"
             : settledCount === debtorCount ? "payer-full"
             : settledCount === 0 ? "payer-none"
             : "payer-partial";
      totalSettled += share;
      // Track what debtors still haven't paid back
      const unsettledDebtors = debtors.filter(p => !(e.settledBy || []).includes(p));
      unsettledDebtors.forEach(p => { outstandingFromOthers += split[p] || 0; });
    } else if (isSettled) { status = "settled"; totalSettled += share; }
    else { status = "unsettled"; totalUnsettled += share; }

    personExpenses.push({
      name: e.name || "Untitled",
      category: e.category || "Misc",
      date: e.date || "",
      totalCost: cost,
      share: share,
      paidAmount: paidAmount,
      status: status,
      settledCount,
      debtorCount,
      index: i
    });
  });

  const netOutstanding = outstandingFromOthers - totalUnsettled;
  const netClass = netOutstanding > 0.01 ? "positive" : netOutstanding < -0.01 ? "negative" : "even";
  const netLabel = netOutstanding > 0.01 ? "Is owed " + fmtCurrency(netOutstanding) : netOutstanding < -0.01 ? "Owes " + fmtCurrency(-netOutstanding) : "Even";

  const statusBadge = (pe) => {
    const s = pe.status;
    if (s === "payer-full" || s === "payer-solo")
      return '<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Fully recovered</span>';
    if (s === "payer-partial")
      return `<span style="display:inline-block;background:#fff8e1;color:#f57f17;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">${pe.settledCount}/${pe.debtorCount} settled</span>`;
    if (s === "payer-none")
      return '<span style="display:inline-block;background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Awaiting payment</span>';
    if (s === "settled")
      return '<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Settled</span>';
    return '<span style="display:inline-block;background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;">Unsettled</span>';
  };

  const tableRows = personExpenses.length ? personExpenses.map(pe => `
    <tr>
      <td><strong>${escapeHtml(pe.name)}</strong></td>
      <td class="cat-badge"><span>${escapeHtml(pe.category)}</span></td>
      <td class="num">${fmtCurrency(pe.totalCost)}</td>
      <td>${pe.date || "—"}</td>
      <td class="num">${fmtCurrency(pe.share)}</td>
      <td class="num">${pe.status.startsWith("payer") ? fmtCurrency(pe.paidAmount) : pe.status === "settled" ? fmtCurrency(pe.share) : fmtCurrency(0)}</td>
      <td style="text-align:center;">${statusBadge(pe)}</td>
    </tr>
  `).join("") : `<tr><td colspan="7" style="text-align:center;color:var(--ink-soft);padding:24px;">No expenses yet</td></tr>`;

  showModal({
    title: `${escapeHtml(name)}'s Expenses`,
    size: "lg",
    body: `
      <div class="person-detail-summary" style="grid-template-columns:repeat(4,1fr);">
        <div class="person-detail-stat">
          <div class="label">Total Owed</div>
          <div class="value">${fmtCurrency(totalOwed)}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Total Paid</div>
          <div class="value">${fmtCurrency(totalPaid)}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Balance</div>
          <div class="value ${netClass}">${netLabel}</div>
        </div>
        <div class="person-detail-stat">
          <div class="label">Settled</div>
          <div class="value ${totalUnsettled < 0.01 && totalOwed > 0 ? 'positive' : totalUnsettled > 0.01 ? 'negative' : 'even'}">
            ${totalOwed > 0 ? (totalUnsettled < 0.01 ? '✓ All' : fmtCurrency(totalUnsettled) + ' left') : '—'}
          </div>
        </div>
      </div>
      <div class="person-detail-expenses">
        <table>
          <thead>
            <tr>
              <th>Expense</th>
              <th>Category</th>
              <th class="num">Total Cost</th>
              <th>Date</th>
              <th class="num">Their Share</th>
              <th class="num">Paid</th>
              <th style="text-align:center;">Status</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          ${personExpenses.length ? `
          <tfoot>
            <tr>
              <td colspan="4">Total</td>
              <td class="num">${fmtCurrency(totalOwed)}</td>
              <td class="num">${fmtCurrency(totalPaid)}</td>
              <td></td>
            </tr>
          </tfoot>` : ""}
        </table>
      </div>
    `,
    actions: [
      { label: "Close", primary: true, onClick: () => closeModal() }
    ]
  });
}

function addExpense() {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.expenses = t.expenses || [];
  t.expenses.push({ id: uid(), name: "", category: "Misc", cost: null, date: "", paidBy: [], settledBy: [], note: "" });
  saveState(); render();
}
function updateExpense(i, key, value) {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.expenses[i][key] = value; saveState();
  // re-render to update totals
  if (key === "cost" || key === "paidBy") render();
}
function deleteExpense(i) {
  if (!guardEdit()) return;
  const t = currentTrip();
  t.expenses.splice(i, 1); saveState(); render();
}

Object.assign(window, {
  setExpensePage, setExpensePageSize, setExpenseSearch,
  expenseParticipants, computeSplit,
  renderExpenses,
  openSplitEditor, changeSplitMethod, updateSplitDetail, toggleSplitParticipant,
  setAllSplitParticipants, toggleGroupParticipants, splitAutoBalance,
  openPayerDialog, dialogTogglePayer, dialogToggleSettle,
  settleWithPerson, settleOneDebt, buildDetailedDebts,
  openPersonDetail,
  addExpense, updateExpense, deleteExpense,
});

