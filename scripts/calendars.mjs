// Builds the calendar files in cal/ — one per series and reminder time —
// that the "Add to Calendar" / "Apple Calendar" button opens. Each holds
// the readings from today on, so the publish workflow rebuilds them every
// morning (and on every publish). cal/ isn't kept in git.
//   npm run calendars
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { buildSchedule } from '../js/schedule.js';
import { buildICS, REMINDER_TIMES, calendarFile } from '../js/reminders.js';
import { config } from '../config.js';

export function calendarFiles(from = new Date()) {
  const index = JSON.parse(readFileSync('series/index.json', 'utf8'));
  const files = {};
  for (const entry of index.series) {
    const series = JSON.parse(readFileSync(entry.path, 'utf8'));
    const schedule = buildSchedule(series);
    for (const time of REMINDER_TIMES) {
      files[calendarFile(series.id, time)] = buildICS({ series, schedule, time, appUrl: config.siteUrl, from });
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
