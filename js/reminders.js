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

// ---------- Calendar (.ics) export ----------

function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function icsDateTime(date, hhmm) {
  const [h, m] = hhmm.split(':');
  return `${toISO(date).replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
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

export function buildICS({ series, schedule, time, appUrl, from = new Date(), sermonTime = null }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const start = startOfDay(from);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//N&N Sermons//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(series.title + ' Reading Plan')}`,
  ];

  const event = ({ uid, date, at, minutes, summary, description, url, alarm }) => {
    const [h, m] = at.split(':').map(Number);
    const endMins = h * 60 + m + minutes;
    const end = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@sermon-series`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDateTime(date, at)}`,
      `DTEND:${icsDateTime(date, end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      `URL:${url}`,
    );
    if (alarm) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(summary)}`, 'TRIGGER:PT0M', 'END:VALARM');
    }
    lines.push('END:VEVENT');
  };

  for (const week of schedule) {
    for (const day of week.days) {
      if (day.date < start) continue;
      event({
        uid: `${series.id}-${day.id}`,
        date: day.date,
        at: time,
        minutes: 15,
        summary: `${series.title}: ${day.passage || `Week ${week.number}, Day ${day.index}`}`,
        description: [day.title, day.prompt, `Open the app: ${appUrl}#/week/${week.number}`]
          .filter(Boolean)
          .join('\n\n'),
        url: `${appUrl}#/week/${week.number}`,
        alarm: true,
      });
    }
    if (sermonTime && week.sermonDate >= start) {
      event({
        uid: `${series.id}-w${week.number}-sermon`,
        date: week.sermonDate,
        at: sermonTime,
        minutes: 60,
        summary: `${series.title} Week ${week.number}${week.passage ? ': ' + week.passage : ''}`,
        description: [week.title, `${appUrl}#/week/${week.number}`].filter(Boolean).join('\n\n'),
        url: `${appUrl}#/week/${week.number}`,
        alarm: false,
      });
    }
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
