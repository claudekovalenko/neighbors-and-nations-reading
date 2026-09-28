// Mon–Sat marks for the days someone read the week's passage. Opening the
// passage marks today automatically; tapping a day fixes a mistake.
import { sameDay } from './schedule.js';
import { progress } from './store.js';
import { esc, fmtWeekday, fmtLong, icon } from './ui.js';

export function trackerHtml(series, week, today) {
  if (!week.days.length || !week.passage) return '';
  const dots = week.days.map((d) => {
    const done = progress.isDone(series.id, d.id);
    const isToday = sameDay(d.date, today);
    const future = d.date > today;
    return `<button class="dot ${done ? 'is-done' : ''} ${isToday ? 'is-today' : ''}" data-day="${d.id}"
        aria-pressed="${done}" aria-label="${esc(fmtLong(d.date))}${done ? ', read' : ''}" ${future ? 'disabled' : ''}>
        <span class="dot-mark">${done ? icon('check') : ''}</span>
        <span class="dot-day">${esc(fmtWeekday(d.date).slice(0, 3))}</span>
      </button>`;
  });
  return `<div class="tracker" role="group" aria-label="Days you read it"><div class="dots">${dots.join('')}</div></div>`;
}

function show(btn, done) {
  btn.classList.toggle('is-done', done);
  btn.setAttribute('aria-pressed', String(done));
  btn.querySelector('.dot-mark').innerHTML = done ? icon('check') : '';
}

export function mountTracker(root, ctx) {
  root.querySelectorAll('.dot[data-day]').forEach((btn) =>
    btn.addEventListener('click', () => {
      show(btn, progress.toggle(ctx.series.id, btn.dataset.day));
      ctx.onProgressChange();
    }),
  );

  // Opening the passage counts as reading it today.
  root.addEventListener('click', (e) => {
    if (!e.target.closest('.read-link')) return;
    const today = root.querySelector('.dot.is-today');
    if (!today || today.classList.contains('is-done')) return;
    progress.markDone(ctx.series.id, today.dataset.day);
    show(today, true);
    ctx.onProgressChange();
  });
}
