// "Get the app": shown at the top of Today in a browser (never inside the
// installed app) and on the Reminder tab. Where the browser allows it (Chrome/Edge on
// Android and computers) it's a one-tap Install button; everywhere else it's
// the browser's own steps, with its own symbols, in as few words as possible.
// iPhones can't install from a button at all (Apple doesn't allow it).
import { settings } from './store.js';
import { esc, icon } from './ui.js';
import { config } from '../config.js';

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS

// Drawn like the iPhone's own Share and Add to Home Screen symbols.
export const SHARE_ICON =
  '<svg class="icon share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';

export const ADD_ICON =
  '<svg class="icon add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

const MENU_DOTS = '<svg class="icon menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-label="menu"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const MENU_LINES = '<svg class="icon menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-label="menu"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const MORE_DOTS = '<svg class="icon menu-icon" viewBox="0 0 24 24" fill="currentColor" aria-label="more"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const INSTALL_ICON = '<svg class="icon menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 8v6M9 11l3 3 3-3M8 20h8"/></svg>';
const b = (t) => `<strong>${t}</strong>`;

// Which browser is this? Pure, so it can be tested with sample user agents.
export function detectBrowser(ua, { touchMac = false } = {}) {
  const ios = /iphone|ipad|ipod/i.test(ua) || touchMac;
  if (ios) {
    if (/CriOS/i.test(ua)) return 'ios-chrome';
    if (/FxiOS/i.test(ua)) return 'ios-firefox';
    if (/EdgiOS/i.test(ua)) return 'ios-edge';
    return 'ios-safari';
  }
  if (/android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return 'android-samsung';
    if (/Firefox/i.test(ua)) return 'android-firefox';
    if (/EdgA/i.test(ua)) return 'android-edge';
    return 'android-chrome';
  }
  if (/Edg\//i.test(ua)) return 'desktop-edge';
  if (/Firefox/i.test(ua)) return 'desktop-firefox';
  if (/Chrome|Chromium/i.test(ua)) return 'desktop-chrome';
  if (/Safari/i.test(ua) && /Macintosh/i.test(ua)) return 'mac-safari';
  return 'other';
}

// Two short steps per browser, each with that browser's own symbol.
export const STEPS = {
  'ios-safari': [`Tap ${SHARE_ICON} ${b('Share')} <span class="install-hint">(or ${b('•••')} first)</span>`, `Scroll to ${ADD_ICON} ${b('Add to Home Screen')}`],
  'ios-chrome': [`Tap ${SHARE_ICON} ${b('Share')} <span class="install-hint">(top right)</span>`, `Scroll to ${ADD_ICON} ${b('Add to Home Screen')}`],
  'ios-firefox': [`Tap ${MENU_LINES} menu, then ${SHARE_ICON} ${b('Share')}`, `Scroll to ${ADD_ICON} ${b('Add to Home Screen')}`],
  'ios-edge': [`Tap ${MORE_DOTS} menu, then ${SHARE_ICON} ${b('Share')}`, `Scroll to ${ADD_ICON} ${b('Add to Home Screen')}`],
  'android-chrome': [`Tap ${MENU_DOTS} menu <span class="install-hint">(top right)</span>`, `Tap ${b('Add to Home screen')} or ${b('Install app')}`],
  'android-samsung': [`Tap ${MENU_LINES} menu <span class="install-hint">(bottom right)</span>`, `Tap ${b('Add page to')} → ${b('Home screen')}`],
  'android-firefox': [`Tap ${MENU_DOTS} menu`, `Tap ${b('Add to Home screen')}`],
  'android-edge': [`Tap ${MORE_DOTS} menu <span class="install-hint">(bottom)</span>`, `Tap ${b('Add to phone')}`],
  'desktop-chrome': [`Click ${INSTALL_ICON} in the address bar`, `Or ${MENU_DOTS} menu → ${b('Install N&amp;N Reading Plan')}`],
  'desktop-edge': [`Click ${INSTALL_ICON} in the address bar`, `Or ${MORE_DOTS} menu → ${b('Apps')} → ${b('Install')}`],
  'mac-safari': [`Click ${b('File')} in the menu bar`, `Choose ${b('Add to Dock')}`],
  'desktop-firefox': [`Open this page in ${b('Chrome')} or ${b('Edge')}`, `Then click ${INSTALL_ICON} in the address bar`],
  other: [`Open your browser’s menu`, `Choose ${b('Add to Home screen')} or ${b('Install')}`],
};

const currentBrowser = () =>
  detectBrowser(navigator.userAgent, { touchMac: navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 });

// The install button (when the browser offers one) or that browser's steps.
export function installBody(ctx, buttonId = 'install-app') {
  if (ctx.installPrompt) {
    return `<button class="btn btn-primary install-btn" id="${buttonId}">${icon('book')} Install the app</button>`;
  }
  const steps = STEPS[currentBrowser()] ?? STEPS.other;
  return `<ol class="install-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
}

// After "Not now", say once where the steps live.
let justDismissed = false;

export function installCardHtml(ctx) {
  if (isStandalone()) return '';
  if (justDismissed) {
    justDismissed = false;
    return '<p class="install-hint install-moved">Install steps are under <a href="#/settings">Reminder</a>.</p>';
  }
  if (settings.get().installDismissed) return '';
  return `
    <section class="card install-card" aria-label="Get the app">
      <div class="install-head">
        <img src="icons/icon.svg" alt="" width="40" height="40">
        <div>
          <p class="install-title">Get the app</p>
          <p class="install-sub">On your home screen</p>
        </div>
        <button class="install-close" id="install-dismiss" aria-label="Not now">${icon('close')}</button>
      </div>
      ${installBody(ctx)}
    </section>`;
}

export function mountInstall(root, ctx) {
  root.querySelector('#install-dismiss')?.addEventListener('click', () => {
    settings.set({ installDismissed: true });
    justDismissed = true;
    ctx.rerender();
  });
  root.querySelector('#install-app')?.addEventListener('click', async () => {
    const prompt = ctx.installPrompt;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    ctx.installPrompt = null;
    ctx.rerender();
  });
}
