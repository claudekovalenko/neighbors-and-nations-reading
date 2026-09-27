import { notes } from '../store.js';
import { esc, fmtLong, icon } from '../ui.js';
import { scriptureBlock, mountScripture, copyright } from './day.js';
import { weekHeading } from './weeks.js';

// The Sunday sermon passage itself, to read and listen to ahead of time.
export function passageView(ctx, [wn]) {
  const { series, schedule } = ctx;
  const week = schedule[Number(wn) - 1];
  if (!week?.passage) return null;
  const noteId = `w${week.number}-sermon`;

  return {
    title: week.passage,
    html: `
      <a class="back-link" href="#/week/${week.number}">${icon('back')} Week ${week.number}</a>
      <header class="page-head">
        <p class="eyebrow">Sunday’s passage · Week ${week.number} · ${esc(fmtLong(week.sermonDate))}</p>
        <h1 class="passage">${esc(week.passage)}</h1>
        ${week.title ? `<p class="lead">${esc(weekHeading(week))}</p>` : ''}
      </header>

      ${scriptureBlock(week.passage)}

      <section class="notes">
        <label class="eyebrow" for="note">My notes <span class="muted">(saved on this device)</span></label>
        <textarea id="note" rows="4" placeholder="Questions to bring on Sunday, or what you want to remember from the message.">${esc(notes.get(series.id, noteId))}</textarea>
      </section>

      <a class="btn btn-secondary btn-block" href="#/week/${week.number}">See the week’s plan</a>
      ${copyright()}`,

    mount(root) {
      let t;
      root.querySelector('#note').addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => notes.set(series.id, noteId, e.target.value.trim() ? e.target.value : ''), 400);
      });
      mountScripture(root, week.passage);
    },
  };
}
