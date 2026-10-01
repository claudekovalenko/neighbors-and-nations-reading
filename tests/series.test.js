import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSeries } from '../js/validate.js';
import { buildICS, readingRuns, googleCalendar, snapTime, timeLabel } from '../js/reminders.js';
import { buildSchedule, toISO } from '../js/schedule.js';
import { calendarFiles } from '../scripts/calendars.mjs';

const index = JSON.parse(readFileSync('series/index.json', 'utf8'));

test('index points at an existing active series', () => {
  assert.ok(index.series.some((s) => s.id === index.active));
});

for (const entry of index.series) {
  test(`${entry.path} is valid`, () => {
    const series = JSON.parse(readFileSync(entry.path, 'utf8'));
    assert.equal(series.id, entry.id);
    assert.deepEqual(validateSeries(series), []);
  });
}

test('calendar file: one alarmed event per reading day from today on', () => {
  const series = JSON.parse(readFileSync('series/romans/series.json', 'utf8'));
  const schedule = buildSchedule(series);
  const from = new Date(2026, 9, 1); // Thursday of week 4
  const ics = buildICS({ series, schedule, time: '07:30', appUrl: 'https://example.org/', from });
  const left = schedule.flatMap((w) => w.days).filter((d) => d.date >= from).length;
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, left);
  assert.equal(ics.match(/TRIGGER:PT0M/g).length, left);
  const starts = [...ics.matchAll(/DTSTART:(\d{8})T073000/g)].map((m) => m[1]);
  assert.equal(starts[0], '20261001'); // today first, nothing earlier
  assert.deepEqual(starts.slice(0, 4), ['20261001', '20261002', '20261003', '20261005']); // no Sundays
  assert.ok(ics.includes('SUMMARY:Read Romans 2:1–29'));
  assert.ok(!ics.includes('RRULE'));
  assert.ok(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75));
  assert.equal(buildICS({ series, schedule, time: '07:30', appUrl: '', from: new Date(2028, 0, 1) }).match(/BEGIN:VEVENT/g), null);
});

test('Google Calendar link starts at today and covers the current part', () => {
  const series = JSON.parse(readFileSync('series/romans/series.json', 'utf8'));
  const schedule = buildSchedule(series);
  const g = googleCalendar({ series, schedule, time: '07:00', appUrl: 'https://example.org/', now: new Date(2026, 9, 1) });
  const u = new URL(g.url);
  assert.equal(u.searchParams.get('dates'), '20261001T070000/20261001T071500');
  assert.match(u.searchParams.get('recur'), /^RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA;COUNT=\d+$/);
  assert.equal(toISO(g.until), '2026-11-14');
  // Sunday between parts: starts with the next part.
  const later = googleCalendar({ series, schedule, time: '07:00', appUrl: '', now: new Date(2027, 0, 10) });
  assert.equal(new URL(later.url).searchParams.get('dates').slice(0, 8), '20270329');
  assert.equal(googleCalendar({ series, schedule, time: '07:00', appUrl: '', now: new Date(2028, 0, 1) }), null);
});

test('reminder times snap to the offered half hours', () => {
  assert.equal(snapTime('07:10'), '07:00');
  assert.equal(snapTime('06:50'), '07:00');
  assert.equal(snapTime('02:00'), '05:00');
  assert.equal(timeLabel('13:30'), '1:30 PM');
  assert.equal(timeLabel('12:00'), '12:00 PM');
});

test('npm run calendars builds one file per offered time', () => {
  const files = calendarFiles(new Date(2026, 9, 1));
  assert.equal(Object.keys(files).length, 35);
  assert.ok(files['cal/romans-0700.ics'].includes('DTSTART:20261001T070000'));
});
