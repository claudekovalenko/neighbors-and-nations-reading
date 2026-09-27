// Parses references like "Romans 1:1-7", "Romans 1:18-2:3", "Psalm 98",
// "Romans 1-2", "Luke 1:5-25; 2:1-7". Returns segments of whole-or-partial
// chapters: [{ book, chapter, from, to }] where to === null means "to the end".
import { findBook } from './books.js';

export function parseReference(ref) {
  const segments = [];
  let book = null;
  for (let part of String(ref).replace(/[–—]/g, '-').split(/;/)) {
    part = part.trim();
    if (!part) continue;
    const m = part.match(/^((?:[1-3]|i{1,3})?\s*[a-z][a-z .]*?)\s*(\d.*)?$/i);
    let rest = part;
    if (m && /[a-z]/i.test(m[1]) && findBook(m[1])) {
      book = findBook(m[1]);
      rest = (m[2] ?? '').trim();
    }
    if (!book) return null;
    if (!rest) return null; // a book with no chapter isn't a reading
    rest = rest.replace(/\s+/g, '');

    let r;
    if ((r = rest.match(/^(\d+):(\d+)-(\d+):(\d+)$/))) {
      const [c1, v1, c2, v2] = r.slice(1).map(Number);
      segments.push({ book, chapter: c1, from: v1, to: null });
      for (let c = c1 + 1; c < c2; c++) segments.push({ book, chapter: c, from: 1, to: null });
      segments.push({ book, chapter: c2, from: 1, to: v2 });
    } else if ((r = rest.match(/^(\d+):(\d+)(?:-(\d+))?$/))) {
      const [c, v1, v2] = [Number(r[1]), Number(r[2]), r[3] ? Number(r[3]) : Number(r[2])];
      segments.push({ book, chapter: c, from: v1, to: v2 });
    } else if ((r = rest.match(/^(\d+)(?:-(\d+))?$/))) {
      const [c1, c2] = [Number(r[1]), r[2] ? Number(r[2]) : Number(r[1])];
      for (let c = c1; c <= c2; c++) segments.push({ book, chapter: c, from: 1, to: null });
    } else {
      return null;
    }
  }
  return segments.length ? segments : null;
}
