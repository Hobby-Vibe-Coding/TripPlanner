import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
import { updateHeaderUI, clearToken } from './auth.js';
import { setToken, getToken } from './utils.js';

const render = () => window.render();

// -------- AUTH MODAL --------
function showLoginModal(defaultTab = "login") {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return;
  const inputStyle = "width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:14px;";
  modalRoot.innerHTML = `
    <div class="modal-bg login-bg" onclick="if(event.target===this&&${isLoggedIn()})closeModal()">
      <div class="modal" style="max-width:400px;">
        <div class="modal-head" style="padding:22px 24px 0;">
          <h3 id="auth-modal-title" style="font-size:20px;font-weight:700;">Sign In</h3>
        </div>
        <div class="modal-body" style="padding:20px 24px 28px;">

          <div style="display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <button id="tab-login" onclick="switchAuthTab('login')"
              style="flex:1;padding:10px;border:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
                     background:var(--primary);color:white;transition:background .15s;">
              Sign In
            </button>
            <button id="tab-register" onclick="switchAuthTab('register')"
              style="flex:1;padding:10px;border:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
                     background:var(--surface);color:var(--ink-soft);transition:background .15s;">
              Register
            </button>
          </div>

          <div id="auth-form-login">
            <div class="field">
              <label>Username</label>
              <input type="text" id="login-username" placeholder="your username" autocomplete="username"
                     style="${inputStyle}"
                     onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()" />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="your password" autocomplete="current-password"
                     style="${inputStyle}"
                     onkeydown="if(event.key==='Enter')submitLogin()" />
            </div>
            <div id="login-error" style="color:#c0392b;font-size:12px;margin-bottom:10px;display:none;"></div>
            <button class="btn primary" style="width:100%;padding:12px;font-size:14px;" onclick="submitLogin()">Sign In</button>
          </div>

          <div id="auth-form-register" style="display:none;">
            <div class="field">
              <label>Username</label>
              <input type="text" id="reg-username" placeholder="3–20 chars: letters, numbers, underscore" autocomplete="username"
                     style="${inputStyle}"
                     onkeydown="if(event.key==='Enter')document.getElementById('reg-password').focus()" />
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="reg-password" placeholder="min 8 characters" autocomplete="new-password"
                     style="${inputStyle}"
                     onkeydown="if(event.key==='Enter')document.getElementById('reg-confirm').focus()" />
            </div>
            <div class="field">
              <label>Confirm password</label>
              <input type="password" id="reg-confirm" placeholder="repeat password" autocomplete="new-password"
                     style="${inputStyle}"
                     onkeydown="if(event.key==='Enter')submitRegister()" />
            </div>
            <div id="reg-error" style="color:#c0392b;font-size:12px;margin-bottom:10px;display:none;"></div>
            <button class="btn primary" style="width:100%;padding:12px;font-size:14px;" onclick="submitRegister()">Create Account</button>
          </div>

        </div>
      </div>
    </div>`;
  switchAuthTab(defaultTab);
}
function switchAuthTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("auth-form-login").style.display = isLogin ? "" : "none";
  document.getElementById("auth-form-register").style.display = isLogin ? "none" : "";
  document.getElementById("auth-modal-title").textContent = isLogin ? "Sign In" : "Create Account";
  document.getElementById("tab-login").style.background = isLogin ? "var(--primary)" : "var(--surface)";
  document.getElementById("tab-login").style.color = isLogin ? "white" : "var(--ink-soft)";
  document.getElementById("tab-register").style.background = isLogin ? "var(--surface)" : "var(--primary)";
  document.getElementById("tab-register").style.color = isLogin ? "var(--ink-soft)" : "white";
  const firstInput = isLogin ? "login-username" : "reg-username";
  setTimeout(() => document.getElementById(firstInput)?.focus(), 50);
}
async function submitLogin() {
  const username = document.getElementById("login-username")?.value.trim();
  const password = document.getElementById("login-password")?.value;
  const errEl = document.getElementById("login-error");
  if (!username || !password) return;
  const btn = document.querySelector("#auth-form-login .btn.primary");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setToken(data.token);
    try { setCurrentUser(JSON.parse(atob(data.token.split(".")[1]))); } catch { setCurrentUser(null); }
    updateHeaderUI();
    closeModal();
    setState(await loadState());
    render();
  } catch (err) {
    if (btn) btn.disabled = false;
    if (errEl) { errEl.textContent = err.message; errEl.style.display = ""; }
  }
}
async function submitRegister() {
  const username = document.getElementById("reg-username")?.value.trim();
  const password = document.getElementById("reg-password")?.value;
  const confirm = document.getElementById("reg-confirm")?.value;
  const errEl = document.getElementById("reg-error");
  if (!username || !password || !confirm) return;
  if (password !== confirm) {
    if (errEl) { errEl.textContent = "Passwords do not match."; errEl.style.display = ""; }
    return;
  }
  const btn = document.querySelector("#auth-form-register .btn.primary");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    setToken(data.token);
    try { setCurrentUser(JSON.parse(atob(data.token.split(".")[1]))); } catch { setCurrentUser(null); }
    updateHeaderUI();
    closeModal();
    setState(await loadState());
    render();
  } catch (err) {
    if (btn) btn.disabled = false;
    if (errEl) { errEl.textContent = err.message; errEl.style.display = ""; }
  }
}

Object.assign(window, { showLoginModal, switchAuthTab, submitLogin, submitRegister });

