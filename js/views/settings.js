import { settings } from '../store.js';
import { REMINDER_TIMES, timeLabel, snapTime, calendarFile, googleCalendar } from '../reminders.js';
import { ESV_COPYRIGHT, esvConfigured } from '../esv.js';
import { config } from '../../config.js';
import { esc, icon, fmtShort } from '../ui.js';
import { installBody, isStandalone, isIOS } from '../install.js';

export function settingsView(ctx) {
  const s = settings.get();
  const { series, index } = ctx;

  // Daily reminder. iPhone/iPad: one button that opens the calendar file
  // (iPhone's Calendar shows "Add All"; Google's add-event link doesn't
  // work on iPhone). Elsewhere: Google Calendar, plus the file for Apple,
  // Outlook or Samsung.
  const time = snapTime(s.reminderTime);
  const google = googleCalendar({ series, schedule: ctx.schedule, time, appUrl: config.siteUrl });
  const ics = calendarFile(series.id, time);
  // A home-screen iPhone app can't open calendar files itself; hand it to Safari.
  const icsHref = isIOS() && isStandalone() ? `x-safari-${new URL(ics, config.siteUrl).href}` : ics;
  const timePicker = `
      <label class="field">Time
        <select id="reminder-time">${REMINDER_TIMES.map((t) => `<option value="${t}" ${t === time ? 'selected' : ''}>${timeLabel(t)}</option>`).join('')}</select>
      </label>`;
  const reminder = !google ? '' : isIOS() ? `
    <section class="card">
      <h2 class="section-title">${icon('bell')} Daily reminder</h2>
      ${timePicker}
      <div class="cal-buttons">
        <a class="btn btn-primary" id="cal-apple" href="${esc(icsHref)}">${icon('calendar')} Add to Calendar</a>
      </div>
    </section>` : `
    <section class="card">
      <h2 class="section-title">${icon('bell')} Daily reminder</h2>
      ${timePicker}
      <div class="cal-buttons">
        <a class="btn btn-secondary" id="cal-google" href="${esc(google.url)}" target="_blank" rel="noopener">${icon('calendar')} Google Calendar</a>
        <a class="btn btn-secondary" id="cal-apple" href="${esc(ics)}" download>${icon('calendar')} Apple, Outlook or other</a>
      </div>
      <p class="muted small cal-note">Google: through ${esc(fmtShort(google.until))}</p>
    </section>`;

  // Steps for this person's browser; gone once they're in the installed app.
  const install = isStandalone() ? '' : `
    <section class="card">
      <h2 class="section-title">Get the app</h2>
      ${installBody(ctx, 'install')}
    </section>`;

  const seriesPicker = index.series.length > 1 ? `
    <section class="card">
      <h2 class="section-title">Series</h2>
      <div class="field">
        <select id="series" aria-label="Series to show">
          <option value="" ${!s.seriesId ? 'selected' : ''}>Automatic — current series</option>
          ${index.series.map((e) => `<option value="${esc(e.id)}" ${e.id === s.seriesId ? 'selected' : ''}>${esc(e.title ?? e.id)}</option>`).join('')}
        </select>
      </div>
    </section>` : '';

  return {
    title: 'Reminder',
    html: `
      <header class="page-head"><h1>Reminder</h1></header>

      ${seriesPicker}

      ${reminder}
      ${install}

      ${esvConfigured() ? `<section class="card">
        <h2 class="section-title">Reading text size</h2>
        <div class="segmented" role="radiogroup" aria-label="Text size">
          ${['s', 'm', 'l', 'xl'].map((k) => `
            <label><input type="radio" name="size" value="${k}" ${s.textSize === k ? 'checked' : ''}><span>${{ s: 'Small', m: 'Medium', l: 'Large', xl: 'Larger' }[k]}</span></label>`).join('')}
        </div>
      </section>`: ''}

      <footer class="about">
        <p><strong>${esc(config.appName)}</strong> · ${esc(config.church)}</p>
        <p class="small">Version ${esc(config.version)}</p>
        ${esvConfigured() ? `<p class="copyright">${esc(ESV_COPYRIGHT)}</p>` : '<p>Scripture: ESV</p>'}
      </footer>`,

    mount(root) {
      root.querySelector('#reminder-time')?.addEventListener('change', (e) => {
        settings.set({ reminderTime: e.target.value });
        ctx.rerender();
      });

      root.querySelectorAll('input[name="size"]').forEach((r) =>
        r.addEventListener('change', () => {
          settings.set({ textSize: r.value });
          ctx.applySettings();
        }),
      );

      root.querySelector('#install')?.addEventListener('click', async () => {
        ctx.installPrompt.prompt();
        await ctx.installPrompt.userChoice;
        ctx.installPrompt = null;
        ctx.rerender();
      });

      root.querySelector('#series')?.addEventListener('change', (e) => ctx.switchSeries(e.target.value));

    },
  };
}
