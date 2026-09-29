// The week's passage, ESV only. Without an ESV API key it's a button that
// opens exactly these verses on BibleGateway; with a key the text shows here.
import { getPassageHtml, esvConfigured, esvLink, bibleAppLink, ESV_COPYRIGHT } from './esv.js';
import { esc, ref as fmtRef, icon } from './ui.js';

export function scriptureBlock(ref) {
  const app = bibleAppLink(ref);
  const button = `<a class="btn btn-primary read-link" href="${esc(esvLink(ref))}" target="_blank" rel="noopener">${icon('book')} Read ${esc(fmtRef(ref))}</a>
    ${app ? `<a class="alt-read read-link" href="${esc(app)}" target="_blank" rel="noopener">Open in the Bible App ${icon('external')}</a>` : ''}`;
  if (!esvConfigured()) return `<div class="read-actions">${button}</div>`;
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
      target.outerHTML = `<a class="btn btn-primary read-link" href="${esc(esvLink(ref))}" target="_blank" rel="noopener">${icon('book')} Read ${esc(fmtRef(ref))}</a>`;
    },
  );
}
