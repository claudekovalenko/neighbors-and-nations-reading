import { locate, sameDay, resumesAfterBreak } from '../schedule.js';
import { notes } from '../store.js';
import { esc, fmtLong, fmtShort, icon, videoBlock, spotifyBlock } from '../ui.js';
import { scriptureBlock, mountScripture, copyright } from '../scripture.js';
import { trackerHtml, mountTracker } from '../tracker.js';

export function weekHeading(week) {
  return week.title || week.passage || `Week ${week.number}`;
}

export function weeksListView(ctx) {
  const { series, schedule } = ctx;
  const loc = locate(schedule);

  // Group headings: a new "part", or the series resuming after a break.
  const heading = (w) => {
    const prev = schedule[w.number - 2];
    if (w.part && w.part !== prev?.part) {
      const inPart = schedule.filter((x) => x.part === w.part);
      const range = `${fmtShort(inPart[0].sermonDate)} – ${fmtShort(inPart.at(-1).sermonDate)}`;
      return `<li class="part-head"><h2>${esc(w.part)}</h2><span>${esc(range)}</span></li>`;
    }
    if (!w.part && resumesAfterBreak(schedule, w)) {
      return `<li class="part-head"><span>Resumes ${esc(fmtShort(w.sermonDate))}</span></li>`;
    }
    return '';
  };

  const items = schedule.map((w) => {
    const current = loc.currentWeek?.number === w.number;
    const past = w.sermonDate < loc.today;
    const sub = w.title && w.passage ? w.passage : w.title || w.passage ? '' : 'Passage coming soon';
    return `${heading(w)}
      <li>
        <a class="week-row ${current ? 'is-current' : ''} ${past ? 'is-past' : ''}" href="#/week/${w.number}" ${current ? 'aria-current="true"' : ''}>
          <span class="week-num">${w.number}</span>
          <span class="week-body">
            <span class="week-date">${esc(fmtShort(w.sermonDate))}${current ? ' · This week' : ''}</span>
            <span class="week-title">${esc(weekHeading(w))}</span>
            ${sub ? `<span class="week-sub">${esc(sub)}</span>` : ''}
          </span>
          ${icon('chevron', 'row-chevron')}
        </a>
      </li>`;
  });

  return {
    title: 'Weeks',
    html: `
      <header class="page-head">
        <p class="eyebrow">${esc(series.title)} · ${schedule.length} weeks</p>
        <h1>All weeks</h1>
      </header>
      <ol class="week-list">${items.join('')}</ol>`,
  };
}

export function weekDetailView(ctx, [n]) {
  const { series, schedule } = ctx;
  const week = schedule[Number(n) - 1];
  if (!week) return null;
  const loc = locate(schedule);
  const preached = week.sermonDate < loc.today || sameDay(week.sermonDate, loc.today);
  const prev = schedule[week.number - 2];
  const next = schedule[week.number];
  const noteId = `w${week.number}`;

  return {
    title: `Week ${week.number}`,
    html: `
      <a class="back-link" href="#/weeks">${icon('back')} All weeks</a>
      <header class="page-head">
        <p class="eyebrow">Week ${week.number} · ${esc(fmtLong(week.sermonDate))}</p>
        <h1 class="passage">${esc(week.passage || weekHeading(week))}</h1>
        ${week.title && week.passage ? `<p class="lead">${esc(week.title)}</p>` : ''}
        ${week.preacher ? `<p class="muted">${esc(week.preacher)}</p>` : ''}
      </header>

      ${week.passage ? scriptureBlock(week.passage) : '<p class="muted">Passage coming soon.</p>'}
      ${trackerHtml(series, week, loc.today)}

      ${week.bigIdea ? `<blockquote class="big-idea">${esc(week.bigIdea)}</blockquote>` : ''}
      ${week.summary ? `<p>${esc(week.summary)}</p>` : ''}
      ${videoBlock(week.videos?.before, 'A word from our pastor')}

      ${week.podcastEpisodeUrl ? `<section><h2 class="section-title">Listen to the message</h2>${spotifyBlock(week.podcastEpisodeUrl)}</section>` : preached ? '<p class="muted">The recording will be posted soon.</p>' : ''}
      ${videoBlock(week.videos?.after, 'After the message')}

      ${week.questions?.length ? `
        <section>
          <h2 class="section-title">Reflect &amp; discuss</h2>
          <ol class="questions">${week.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
        </section>` : ''}

      <section class="notes">
        <label class="eyebrow" for="note">My notes <span class="muted">(saved on this device)</span></label>
        <textarea id="note" rows="4" placeholder="What stood out? What do you want to remember?">${esc(notes.get(series.id, noteId))}</textarea>
      </section>

      <nav class="pager" aria-label="Weeks">
        ${prev ? `<a href="#/week/${prev.number}">${icon('back')} Week ${prev.number}</a>` : '<span></span>'}
        ${next ? `<a href="#/week/${next.number}">Week ${next.number} ${icon('chevron')}</a>` : '<span></span>'}
      </nav>
      ${copyright()}`,

    mount(root) {
      mountScripture(root);
      mountTracker(root, ctx);
      let t;
      root.querySelector('#note').addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => notes.set(series.id, noteId, e.target.value.trim() ? e.target.value : ''), 400);
      });
    },
  };
}
