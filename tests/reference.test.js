import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseReference } from '../js/reference.js';
import { BOOKS, findBook } from '../js/books.js';

const brief = (ref) => parseReference(ref)?.map((s) => `${s.book.code} ${s.chapter}:${s.from}-${s.to ?? 'end'}`);

test('parses the reference shapes used in the plans', () => {
  assert.deepEqual(brief('Romans 1:1-7'), ['ROM 1:1-7']);
  assert.deepEqual(brief('Romans 1:16'), ['ROM 1:16-16']);
  assert.deepEqual(brief('Psalm 98'), ['PSA 98:1-end']);
  assert.deepEqual(brief('Romans 1-2'), ['ROM 1:1-end', 'ROM 2:1-end']);
  assert.deepEqual(brief('Romans 1:18–3:2'), ['ROM 1:18-end', 'ROM 2:1-end', 'ROM 3:1-2']);
  assert.deepEqual(brief('Matthew 7: 1-12'), ['MAT 7:1-12']);
  assert.deepEqual(brief('Luke 1:5-25; 2:1-7'), ['LUK 1:5-25', 'LUK 2:1-7']);
  assert.deepEqual(brief('1 John 4:7-12'), ['1JN 4:7-12']);
  assert.deepEqual(brief('II Corinthians 5:17'), ['2CO 5:17-17']);
  assert.deepEqual(brief('Song of Songs 2'), ['SNG 2:1-end']);
  assert.equal(parseReference('Romans'), null);
  assert.equal(parseReference('Hezekiah 1:1'), null);
  assert.equal(parseReference(''), null);
});

test('book table covers all 66 books with unique codes', () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(new Set(BOOKS.map((b) => b[0])).size, 66);
  assert.equal(findBook('rom').code, 'ROM');
  assert.equal(findBook('Revelation').code, 'REV');
});

test('every passage in every series is a reference ESV.org understands', () => {
  const index = JSON.parse(readFileSync('series/index.json', 'utf8'));
  for (const entry of index.series) {
    const series = JSON.parse(readFileSync(entry.path, 'utf8'));
    const refs = series.weeks.flatMap((w) => [w.passage, ...(w.days ?? []).map((d) => d.passage)]).filter(Boolean);
    for (const ref of refs) assert.ok(parseReference(ref), `${entry.id}: can't parse "${ref}"`);
  }
});
