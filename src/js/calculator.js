// -------- CALCULATOR --------
let calcState = { expr: "", just: false };
function openCalc() {
  showModal({
    title: "Quick calculator",
    size: "sm",
    body: `
      <div class="calc">
        <div class="calc-display">
          <div class="expr" id="calc-expr"></div>
          <div id="calc-val">0</div>
        </div>
        <div class="calc-grid">
          ${"AC,÷,×,⌫,7,8,9,−,4,5,6,+,1,2,3,=,0,.,(,)".split(",").map((b,i) => {
            const cls = ["÷","×","−","+","="].includes(b) ? (b==="=" ? "eq" : "op") : (b === "AC" || b === "⌫" || b === "(" || b === ")" ? "fn" : "");
            return `<button class="calc-btn ${cls}" onclick="calcPress('${b}')">${b}</button>`;
          }).join("")}
        </div>
        <div class="calc-help">
          <strong>Power tools:</strong> use buttons above, or type math directly.<br>
          Split by N people: e.g. <span class="kbd">450 / 8</span> → ${fmtCurrency(56.25)}<br>
          Press <span class="kbd">Enter</span> to compute.
        </div>
      </div>
    `,
    actions: [{ label: "Close", onClick: closeModal }]
  });
  // attach keyboard listener temporarily
  document.addEventListener("keydown", calcKey);
}
function closeCalcCleanup() { document.removeEventListener("keydown", calcKey); }
function calcKey(e) {
  if (!document.querySelector(".calc")) { closeCalcCleanup(); return; }
  const k = e.key;
  if (/[0-9.+\-*/()]/.test(k)) { calcAppend(k); e.preventDefault(); }
  else if (k === "Enter" || k === "=") { calcEval(); e.preventDefault(); }
  else if (k === "Backspace") { calcBackspace(); e.preventDefault(); }
  else if (k === "Escape") { closeModal(); closeCalcCleanup(); }
}
function calcPress(b) {
  if (b === "AC") { calcState.expr = ""; calcState.just = false; }
  else if (b === "⌫") calcBackspace();
  else if (b === "=") calcEval();
  else if (b === "÷") calcAppend("/");
  else if (b === "×") calcAppend("*");
  else if (b === "−") calcAppend("-");
  else calcAppend(b);
  calcRefresh();
}
function calcAppend(s) {
  if (calcState.just && /[0-9.]/.test(s)) calcState.expr = "";
  calcState.expr += s; calcState.just = false; calcRefresh();
}
function calcBackspace() { calcState.expr = calcState.expr.slice(0, -1); calcRefresh(); }
function calcEval() {
  if (!calcState.expr) return;
  try {
    if (!/^[\d\s+\-*/().]+$/.test(calcState.expr)) { alert("Invalid expression"); return; }
    const v = Function('"use strict";return (' + calcState.expr + ')')();
    document.getElementById("calc-expr").textContent = calcState.expr + " =";
    calcState.expr = String(v); calcState.just = true; calcRefresh();
  } catch (e) { alert("Invalid expression"); }
}
function calcRefresh() {
  const v = document.getElementById("calc-val");
  const x = document.getElementById("calc-expr");
  if (!v) return;
  v.textContent = calcState.expr || "0";
  if (!calcState.just) x.textContent = "";
}

Object.assign(window, { openCalc, calcPress });

