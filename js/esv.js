import { config } from '../config.js';
import { esvCache } from './store.js';
import { parseReference } from './reference.js';

const API = 'https://api.esv.org/v3/passage/html/';

const PARAMS = {
  'include-passage-references': 'false',
  'include-footnotes': 'false',
  // Verses only — no section headings or other editorial additions.
  'include-headings': 'false',
  'include-subheadings': 'false',
  'include-audio-link': 'false',
  'include-short-copyright': 'false',
  'include-copyright': 'false',
};

export const ESV_COPYRIGHT =
  'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), ' +
  '© 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

export function esvConfigured() {
  return Boolean(config.esv.proxyUrl || config.esv.apiKey);
}

// BibleGateway opens on exactly the verses asked for (ESV.org scrolls
// through the whole book around them).
export function esvLink(ref) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=ESV`;
}

// The Bible App (YouVersion; ESV is version 59). Opens the app if it's
// installed, otherwise bible.com. Handles one continuous range within a
// chapter, or whole chapters; anything else returns null.
export function bibleAppLink(ref) {
  const segs = parseReference(ref);
  if (!segs || segs.length !== 1) return null;
  const { book, chapter, from, to } = segs[0];
  const verses = from === 1 && to === null ? '' : `.${from}${to && to !== from ? `-${to}` : ''}`;
  if (to === null && from !== 1) return null;
  return `https://www.bible.com/bible/59/${book.code}.${chapter}${verses}.ESV`;
}

export async function getPassageHtml(ref) {
  const cached = esvCache.get(ref);
  if (cached) return cached;
  if (!esvConfigured()) throw new Error('not-configured');

  const params = new URLSearchParams({ q: ref, ...PARAMS });
  const url = `${config.esv.proxyUrl || API}?${params}`;
  const headers = config.esv.proxyUrl ? {} : { Authorization: `Token ${config.esv.apiKey}` };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`esv-${res.status}`);
  const data = await res.json();
  const html = (data.passages ?? []).join('');
  if (!html) throw new Error('esv-empty');
  esvCache.put(ref, html);
  return html;
}
