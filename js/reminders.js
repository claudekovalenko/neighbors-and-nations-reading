import { toISO, startOfDay } from './schedule.js';
import { progress } from './store.js';

// Shows how many of today's readings are left on the app icon, where the
// phone supports it. (No notifications: a web app can't send them on time
// without a push server; the calendar file is the reminder.)
export function updateBadge({ series, readings }) {
  if (!('setAppBadge' in navigator)) return;
  const undone = readings.filter((d) => !progress.isDone(series.id, d.id));
  try {
    undone.length ? navigator.setAppBadge(undone.length) : navigator.clearAppBadge();
  } catch { /* not supported in this context */ }
}

// ---------- Calendar reminders ----------
// One repeating event per stretch of reading days (the series pauses
// between parts), at the time the person picks. iPhone/Mac get a .ics file
// (pre-built in cal/ so iPhone opens it in Calendar), others a Google
// Calendar link. Both alert at the event time.

const WEEKDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DAY_MS = 864e5;
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => toISO(d).replace(/-/g, '');

// Times offered in Settings: 5:00 AM – 10:00 PM, every half hour.
export const REMINDER_TIMES = Array.from({ length: 35 }, (_, i) => `${pad(5 + Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);

export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

// The nearest offered time (older versions allowed any minute).
export function snapTime(hhmm = '07:00') {
  const [h, m] = hhmm.split(':').map(Number);
  const mins = Math.min(Math.max(h * 60 + Math.round(m / 30) * 30, 300), 1320);
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

export const calendarFile = (seriesId, time) => `cal/${seriesId}-${time.replace(':', '')}.ics`;

// Stretches of reading days with no gap longer than a weekend.
export function readingRuns(schedule) {
  const runs = [];
  for (const d of schedule.flatMap((w) => w.days).sort((a, b) => a.date - b.date)) {
    const run = runs.at(-1);
    if (run && Math.round((d.date - run.end) / DAY_MS) <= 2) {
      run.end = d.date;
      run.dates.push(d.date);
    } else {
      runs.push({ start: d.date, end: d.date, dates: [d.date] });
    }
  }
  return runs.map((r) => ({ ...r, byday: [...new Set(r.dates.map((d) => d.getDay()))].sort().map((n) => WEEKDAY[n]).join(',') }));
}

function eventTimes(date, time) {
  const [h, m] = time.split(':').map(Number);
  const end = h * 60 + m + 15;
  return [`${ymd(date)}T${pad(h)}${pad(m)}00`, `${ymd(date)}T${pad(Math.floor(end / 60))}${pad(end % 60)}00`];
}

const rrule = (run, dates) => `RRULE:FREQ=WEEKLY;BYDAY=${run.byday};COUNT=${dates.length}`;
const summary = (series) => `${series.title}: this week’s passage`;

function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

// Long lines must be folded at 75 octets per RFC 5545.
function fold(line) {
  const out = [];
  while (line.length > 74) {
    out.push(line.slice(0, 74));
    line = ' ' + line.slice(74);
  }
  out.push(line);
  return out.join('\r\n');
}

export function buildICS({ series, schedule, time, appUrl }) {
  const stamp = `${series.startDate.replace(/-/g, '')}T000000Z`; // fixed, so the files only change with the plan
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//N&N Sermons//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsEscape(series.title)}`];
  readingRuns(schedule).forEach((run, i) => {
    const [start, end] = eventTimes(run.start, time);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${series.id}-reading-${i + 1}@nn-sermons`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      rrule(run, run.dates),
      `SUMMARY:${icsEscape(summary(series))}`,
      `DESCRIPTION:${icsEscape(appUrl)}`,
      `URL:${appUrl}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(summary(series))}`, 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Google's add-event link takes one repeating rule, so it covers the
// current (or next) stretch of readings. Returns null once they're over.
export function googleCalendar({ series, schedule, time, appUrl, now = new Date() }) {
  const today = startOfDay(now);
  for (const run of readingRuns(schedule)) {
    const dates = run.dates.filter((d) => d >= today);
    if (!dates.length) continue;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: summary(series),
      dates: eventTimes(dates[0], time).join('/'),
      recur: rrule(run, dates),
      details: appUrl,
    });
    return { url: `https://calendar.google.com/calendar/render?${params}`, until: run.end };
  }
  return null;
}
