// -------- PWA INSTALL --------
const showModal  = o => window.showModal(o);
const closeModal = () => window.closeModal();

let deferredPrompt = null;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  const ua = navigator.userAgent;
  const iosDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS13Up = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iosDevice || iPadOS13Up;
}

function isInAppBrowser() {
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok/i.test(navigator.userAgent);
}

// iOS browsers are all WebKit under the hood, but where the Share button lives
// differs: Safari usually shows it directly in the toolbar, while Chrome/Edge/
// Firefox tuck it behind a "•••" (More) button.
function getIosBrowser() {
  const ua = navigator.userAgent;
  if (/CriOS/.test(ua)) return "chrome";
  if (/EdgiOS/.test(ua)) return "edge";
  if (/FxiOS/.test(ua)) return "firefox";
  return "safari";
}

function updateInstallUI() {
  const show = !isStandalone() && (!!deferredPrompt || isIos());
  const navBtn = document.getElementById("pwa-install-btn");
  if (navBtn) navBtn.style.display = show ? "" : "none";
  const loginBtn = document.getElementById("login-install-btn");
  if (loginBtn) loginBtn.style.display = show ? "" : "none";
}

async function promptInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    updateInstallUI();
    return;
  }
  if (isIos()) {
    showIosInstallModal();
    return;
  }
  showModal({
    title: "Install Trip Planner",
    size: "sm",
    body: `<p style="margin:0;line-height:1.6;">Look for an <strong>Install app</strong> or <strong>Add to Home Screen</strong> option in your browser's menu (usually behind the ⋮ or ≡ icon).</p>`,
    actions: [{ label: "Got it", primary: true, onClick: closeModal }],
  });
}

function showIosInstallModal() {
  const inAppWarning = isInAppBrowser() ? `
    <div style="background:#fff3e0;border:1px solid #f5c88a;border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:13px;line-height:1.5;">
      ⚠️ You're viewing this inside an app's built-in browser, which can't install apps. Tap the ⋯ or browser icon and choose <strong>Open in Safari</strong>, then come back and try again.
    </div>` : "";
  const shareIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:-3px;display:inline-block;"><path d="M12 2v13"/><path d="m8 6 4-4 4 4"/><rect x="4" y="12" width="16" height="9" rx="2"/></svg>`;
  const moreBtn = `<span style="display:inline-block;padding:1px 7px;border-radius:6px;background:var(--surface-solid);border:1px solid var(--line);font-weight:700;letter-spacing:1px;">•••</span>`;

  const browser = getIosBrowser();
  const step1 = browser === "chrome" || browser === "edge"
    ? `Tap ${moreBtn} at the bottom of the screen, then tap <strong>Share</strong>`
    : browser === "firefox"
    ? `Tap ${moreBtn}, then tap <strong>Share</strong> <span style="color:var(--ink-soft);">(Firefox has limited support — Safari installs more reliably)</span>`
    : `Tap the <strong>Share</strong> button ${shareIcon} in the toolbar — don't see it? Tap ${moreBtn} first`;

  showModal({
    title: "Install Trip Planner",
    size: "sm",
    body: `
      ${inAppWarning}
      <p style="margin:0 0 16px;line-height:1.6;font-size:14px;">Add Trip Planner to your Home Screen for one-tap access, a full-screen view, and offline support.</p>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:10px;">
        <div style="flex-shrink:0;width:26px;height:26px;display:grid;place-items:center;background:var(--primary);color:white;border-radius:50%;font-weight:700;font-size:13px;">1</div>
        <div style="font-size:14px;line-height:1.5;">${step1}</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--surface-2);border-radius:12px;">
        <div style="flex-shrink:0;width:26px;height:26px;display:grid;place-items:center;background:var(--primary);color:white;border-radius:50%;font-weight:700;font-size:13px;">2</div>
        <div style="font-size:14px;line-height:1.5;">Scroll down and tap <strong>Add to Home Screen</strong></div>
      </div>
    `,
    actions: [{ label: "Got it", primary: true, onClick: closeModal }],
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  updateInstallUI();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  updateInstallUI();
});

document.addEventListener("DOMContentLoaded", updateInstallUI);

Object.assign(window, { promptInstall, updateInstallUI });
