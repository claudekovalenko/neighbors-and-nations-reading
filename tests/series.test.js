import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

test('calendar reminders: one alarmed repeating event per stretch of readings', () => {
  const series = JSON.parse(readFileSync('series/romans/series.json', 'utf8'));
  const schedule = buildSchedule(series);
  const runs = readingRuns(schedule);
  assert.equal(runs.length, 3); // Romans has three parts
  assert.equal(runs.reduce((n, r) => n + r.dates.length, 0), schedule.flatMap((w) => w.days).length);
  assert.ok(runs.every((r) => r.byday === 'MO,TU,WE,TH,FR,SA'));
  const ics = buildICS({ series, schedule, time: '07:30', appUrl: 'https://example.org/' });
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3);
  assert.equal(ics.match(/TRIGGER:PT0M/g).length, 3);
  assert.ok(ics.includes('DTSTART:20260907T073000'));
  assert.ok(ics.includes('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA;COUNT=60'));
  assert.ok(ics.split('\r\n').every((l) => l.length <= 75));
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

test('calendar files in cal/ are up to date (npm run calendars)', () => {
  const files = calendarFiles();
  assert.deepEqual(readdirSync('cal').sort(), Object.keys(files).map((f) => f.slice(4)).sort());
  for (const [path, text] of Object.entries(files)) {
    assert.equal(readFileSync(path, 'utf8'), text, `${path} is stale — run npm run calendars`);
  }
});
