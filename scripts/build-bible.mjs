#!/usr/bin/env node
// Builds bible/bsb/<BOOK>.json from the public-domain Berean Standard Bible.
// Each file: { "code": "ROM", "name": "Romans", "chapters": [["v1 text", "v2 text", ...], ...] }
//   node scripts/build-bible.mjs [path-or-url-to-BSB.json]
// Default source: scrollmapper/bible_databases on GitHub.
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { BOOKS } from '../js/books.js';

const SRC = process.argv[2] ?? 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/BSB.json';
const data = SRC.startsWith('http') ? await (await fetch(SRC)).json() : JSON.parse(readFileSync(SRC, 'utf8'));

if (data.books.length !== 66) throw new Error(`expected 66 books, got ${data.books.length}`);
rmSync('bible/bsb', { recursive: true, force: true });
mkdirSync('bible/bsb', { recursive: true });

let verses = 0;
data.books.forEach((book, i) => {
  const [code, name] = BOOKS[i];
  const chapters = book.chapters.map((c) => c.verses.map((v) => v.text.trim()));
  verses += chapters.flat().length;
  writeFileSync(`bible/bsb/${code}.json`, JSON.stringify({ code, name, chapters }));
});
console.log(`bible/bsb: 66 books, ${verses} verses`);
