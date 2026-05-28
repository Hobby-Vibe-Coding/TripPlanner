import { currentUser, setCurrentUser, setState, DEFAULT_STATE } from './state.js';
import { getToken, setToken } from './utils.js';

export function clearToken() {
  localStorage.removeItem("tp_token");
  localStorage.removeItem("tp_theme");
  setCurrentUser(null);
  setState(DEFAULT_STATE());
  const root = document.getElementById("app-root");
  if (root) root.innerHTML = "";
  updateHeaderUI();
  window.showLoginModal();
}
export function updateHeaderUI() {
  const btn   = document.getElementById("user-btn");
  const label = document.getElementById("user-label");
  if (currentUser) {
    if (btn)   btn.style.display = "";
    if (label) label.textContent = currentUser.username;
  } else {
    if (btn) btn.style.display = "none";
  }
}
export function openUserMenu() {
  if (confirm(`Signed in as "${currentUser?.username}"\n\nSign out?`)) clearToken();
}
export function isLoggedIn()  { return !!currentUser; }
export function isShareMode() { return document.documentElement.hasAttribute("data-share"); }
export function isEditing() {
  if (currentUser) return true;
  return document.documentElement.getAttribute("data-share") === "edit";
}
export function guardEdit() {
  if (isEditing()) return true;
  if (isShareMode()) {
    window.showModal({
      title: "Read-only view", size: "sm",
      body: '<p style="margin:0;line-height:1.6;">This trip was shared with you in <strong>read-only</strong> mode — you can view but not make changes.</p>',
      actions: [{ label: "Got it", primary: true, onClick: () => window.closeModal() }],
    });
    return false;
  }
  if (!currentUser) { window.showLoginModal(); }
  return false;
}

// Window exports
Object.assign(window, {
  clearToken, updateHeaderUI, openUserMenu,
  isLoggedIn, isShareMode, isEditing, guardEdit,
});

