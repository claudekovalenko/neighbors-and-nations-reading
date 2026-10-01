// Builds the calendar files in cal/ — one per series and reminder time —
// that "Add to Apple Calendar" opens. Run after changing a series' dates:
//   npm run calendars
// (a test fails if they're out of date).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { buildSchedule } from '../js/schedule.js';
import { buildICS, REMINDER_TIMES, calendarFile } from '../js/reminders.js';
import { config } from '../config.js';

export function calendarFiles() {
  const index = JSON.parse(readFileSync('series/index.json', 'utf8'));
  const files = {};
  for (const entry of index.series) {
    const series = JSON.parse(readFileSync(entry.path, 'utf8'));
    const schedule = buildSchedule(series);
    for (const time of REMINDER_TIMES) {
      files[calendarFile(series.id, time)] = buildICS({ series, schedule, time, appUrl: config.siteUrl });
    }
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync('cal', { recursive: true });
  for (const f of readdirSync('cal')) rmSync(`cal/${f}`);
  const files = calendarFiles();
  for (const [path, text] of Object.entries(files)) writeFileSync(path, text);
  console.log(`✓ ${Object.keys(files).length} calendar files in cal/`);
}
