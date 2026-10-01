import { settings, progress } from '../store.js';
import { buildICS, downloadFile } from '../reminders.js';
import { ESV_COPYRIGHT, esvConfigured } from '../esv.js';
import { config } from '../../config.js';
import { esc, icon } from '../ui.js';
import { installBody, isStandalone } from '../install.js';

export function settingsView(ctx) {
  const s = settings.get();
  const { series, index } = ctx;

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
    title: 'Settings',
    html: `
      <header class="page-head"><h1>Settings</h1></header>

      ${install}
      ${seriesPicker}

      <section class="card">
        <h2 class="section-title">${icon('calendar')} Add to your calendar</h2>
        <p>A daily reminder to read, in your phone’s calendar.</p>
        <label class="field">Time <input type="time" id="reminder-time" value="${esc(s.reminderTime)}"></label>
        <label class="switch">
          <input type="checkbox" id="ics-sermons" checked>
          <span>Include Sunday sermons</span>
        </label>
        <button id="ics" class="btn btn-secondary">${icon('calendar')} Download calendar file</button>
      </section>

      ${esvConfigured() ? `<section class="card">
        <h2 class="section-title">Reading text size</h2>
        <div class="segmented" role="radiogroup" aria-label="Text size">
          ${['s', 'm', 'l', 'xl'].map((k) => `
            <label><input type="radio" name="size" value="${k}" ${s.textSize === k ? 'checked' : ''}><span>${{ s: 'Small', m: 'Medium', l: 'Large', xl: 'Larger' }[k]}</span></label>`).join('')}
        </div>
      </section>`: ''}

      <section class="card">
        <h2 class="section-title">Your data</h2>
        <p class="muted small">Progress and notes stay on this device only.</p>
        <button id="reset" class="btn btn-danger">Reset ${esc(series.title)} progress</button>
      </section>

      <footer class="about">
        <p><strong>${esc(config.appName)}</strong> · ${esc(config.church)}</p>
        <p class="small">Version ${esc(config.version)}</p>
        ${esvConfigured() ? `<p class="copyright">${esc(ESV_COPYRIGHT)}</p>` : '<p>Scripture: ESV</p>'}
      </footer>`,

    mount(root) {
      root.querySelector('#reminder-time').addEventListener('change', (e) => {
        if (e.target.value) settings.set({ reminderTime: e.target.value });
      });

      root.querySelector('#ics').addEventListener('click', () => {
        const appUrl = location.href.split('#')[0];
        const ics = buildICS({
          series,
          schedule: ctx.schedule,
          time: settings.get().reminderTime,
          appUrl,
          sermonTime: root.querySelector('#ics-sermons').checked ? series.sermonTime || '10:00' : null,
        });
        downloadFile(`${series.id}-reading-plan.ics`, ics, 'text/calendar');
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

      root.querySelector('#reset').addEventListener('click', () => {
        if (confirm(`Clear your reading progress for ${series.title}? Notes are kept.`)) {
          progress.reset(series.id);
          ctx.onProgressChange();
        }
      });
    },
  };
}
