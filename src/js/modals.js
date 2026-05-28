// -------- MODAL --------
function showModal({ title, body, actions, size, onOpen, dismissOnOverlay = true }) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-bg" ${dismissOnOverlay ? 'onclick="if(event.target===this) closeModal()"' : ''}>
      <div class="modal" style="${size==='sm'?'max-width:380px;':size==='lg'?'max-width:720px;':''}">
        <div class="modal-head">
          <h3>${title}</h3>
          <button class="icon-btn" onclick="closeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-foot">
          ${(actions||[]).map((a, i) => `<button class="btn ${a.primary?'primary':a.danger?'danger':''}" data-aidx="${i}">${a.label}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
  (actions||[]).forEach((a, i) => {
    root.querySelector(`[data-aidx="${i}"]`).onclick = a.onClick;
  });
  if (onOpen) onOpen();
}
function closeModal() { document.getElementById("modal-root").innerHTML = ""; }

Object.assign(window, { showModal, closeModal });

