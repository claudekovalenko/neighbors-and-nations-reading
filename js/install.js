// "Get the app" card shown at the top of Today in a browser (never inside the
// installed app). Android/desktop Chrome get a real one-tap install button;
// iPhones can't install from a button (Apple doesn't allow it), so they get
// the two taps to do, with Safari's Share icon drawn so it's easy to find.
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

export function installCardHtml(ctx) {
  if (isStandalone() || settings.get().installDismissed) return '';

  let body;
  if (ctx.installPrompt) {
    body = `
      <p class="install-text">Add ${esc(config.appName)} to your home screen for quick access each week.</p>
      <button class="btn btn-primary install-btn" id="install-app">${icon('book')} Install the app</button>`;
  } else if (isIOS()) {
    body = `
      <ol class="install-steps">
        <li>Tap ${SHARE_ICON} <strong>Share</strong> <span class="install-hint">(or <strong>•••</strong> first)</span></li>
        <li>Scroll to ${ADD_ICON} <strong>Add to Home Screen</strong></li>
      </ol>`;
  } else {
    body = `
      <p class="install-text">Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>`;
  }

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
      ${body}
    </section>`;
}

export function mountInstall(root, ctx) {
  root.querySelector('#install-dismiss')?.addEventListener('click', () => {
    settings.set({ installDismissed: true });
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
