// Scripture from the Berean Standard Bible, bundled with the app in
// bible/bsb/ (public domain — no key, works offline once opened).
import { parseReference } from './reference.js';
import { esc } from './ui.js';

export const BSB_NOTICE =
  'Scripture quotations are from the Berean Standard Bible (BSB), which has been dedicated to the public domain.';

const books = new Map();

function loadBook(code) {
  if (!books.has(code)) {
    books.set(code, fetch(`bible/bsb/${code}.json`).then((r) => {
      if (!r.ok) throw new Error(`bible-${r.status}`);
      return r.json();
    }).catch((e) => {
      books.delete(code);
      throw e;
    }));
  }
  return books.get(code);
}

// → { segments: [{ book, chapter, verses: [{ n, text }] }] } or throws.
export async function getPassage(ref) {
  const parsed = parseReference(ref);
  if (!parsed) throw new Error('unrecognized-reference');
  const segments = [];
  for (const seg of parsed) {
    const data = await loadBook(seg.book.code);
    const chapter = data.chapters[seg.chapter - 1];
    if (!chapter) throw new Error('no-such-chapter');
    const to = Math.min(seg.to ?? chapter.length, chapter.length);
    const verses = [];
    for (let n = seg.from; n <= to; n++) {
      if (chapter[n - 1]) verses.push({ n, text: chapter[n - 1] }); // a few verses are intentionally empty
    }
    segments.push({ book: data, chapter: seg.chapter, verses });
  }
  return { segments };
}

export function passageHtml({ segments }) {
  const multi = segments.length > 1;
  return segments.map((s) => {
    const body = s.verses
      .map((v, j) =>
        j === 0 && !multi && v.n === 1
          ? `<b class="chapter-num">${s.chapter}</b>${esc(v.text)}`
          : `<b class="verse-num">${v.n}</b>${esc(v.text)}`)
      .join(' ');
    return `${multi ? `<h3>${esc(s.book.name)} ${s.chapter}</h3>` : ''}<p>${body}</p>`;
  }).join('');
}

export function passageText({ segments }) {
  return segments.map((s) => s.verses.map((v) => v.text));
}

// The chapters a passage touches, for chapter-length narrated audio.
export function passageChapters({ segments }) {
  const seen = new Set();
  return segments
    .filter((s) => !seen.has(`${s.book.code}${s.chapter}`) && seen.add(`${s.book.code}${s.chapter}`))
    .map((s) => ({ code: s.book.code, name: s.book.name, chapter: s.chapter }));
}

// Links to read the same passage in other translations.
export const otherTranslations = (ref) => [
  ['ESV', `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=ESV`],
  ['NIV', `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=NIV`],
];
