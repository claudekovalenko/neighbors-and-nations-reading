// The week's passage, ESV only. Without an ESV API key it's a button that
// opens exactly these verses on BibleGateway; with a key the text shows here.
import { getPassageHtml, esvConfigured, esvLink, ESV_COPYRIGHT } from './esv.js';
import { esc, icon } from './ui.js';

export function scriptureBlock(ref) {
  const button = `<a class="btn btn-primary" href="${esc(esvLink(ref))}" target="_blank" rel="noopener">${icon('book')} Read ${esc(ref)}</a>`;
  if (!esvConfigured()) return button;
  return `<article class="scripture" id="scripture" data-ref="${esc(ref)}" aria-live="polite"><p class="muted">Loading ${esc(ref)}…</p></article>`;
}

export const copyright = () => (esvConfigured() ? `<p class="copyright">${esc(ESV_COPYRIGHT)}</p>` : '');

export function mountScripture(root) {
  const target = root.querySelector('#scripture');
  if (!target) return;
  const ref = target.dataset.ref;
  getPassageHtml(ref).then(
    (html) => { if (target.isConnected) target.innerHTML = html; },
    () => {
      if (!target.isConnected) return;
      target.outerHTML = `<a class="btn btn-primary" href="${esc(esvLink(ref))}" target="_blank" rel="noopener">${icon('book')} Read ${esc(ref)}</a>`;
    },
  );
}
