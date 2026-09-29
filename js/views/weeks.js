import { locate, resumesAfterBreak } from '../schedule.js';
import { esc, ref, fmtLong, fmtShort, icon, videoBlock, spotifyBlock } from '../ui.js';
import { scriptureBlock, mountScripture, copyright } from '../scripture.js';
import { trackerHtml, mountTracker } from '../tracker.js';
import { notesHtml, mountNotes } from '../notes.js';

export function weekHeading(week) {
  return week.title || ref(week.passage) || `Week ${week.number}`;
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
    const sub = w.title && w.passage ? ref(w.passage) : w.title || w.passage ? '' : 'Passage coming soon';
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
  const prev = schedule[week.number - 2];
  const next = schedule[week.number];

  return {
    title: `Week ${week.number}`,
    html: `
      <a class="back-link" href="#/weeks">${icon('back')} All weeks</a>
      <header class="page-head">
        <p class="card-meta"><span class="eyebrow">Week ${week.number}</span><span class="meta-date">${esc(fmtLong(week.sermonDate))}</span></p>
        <h1 class="passage">${esc(ref(week.passage) || weekHeading(week))}</h1>
        ${week.title && week.passage ? `<p class="lead">${esc(week.title)}</p>` : ''}
      </header>

      ${week.passage ? scriptureBlock(week.passage) : week.title ? '' : '<p class="muted">Passage coming soon.</p>'}
      ${trackerHtml(series, week, loc.today)}

      ${week.bigIdea ? `<blockquote class="big-idea">${esc(week.bigIdea)}</blockquote>` : ''}
      ${week.summary ? `<p>${esc(week.summary)}</p>` : ''}
      ${videoBlock(week.videos?.before, 'A word from our pastor')}

      ${week.podcastEpisodeUrl ? `<section><h2 class="section-title">Listen to the message</h2>${spotifyBlock(week.podcastEpisodeUrl)}</section>` : ''}
      ${videoBlock(week.videos?.after, 'After the message')}

      ${week.questions?.length ? `
        <section>
          <h2 class="section-title">Reflect &amp; discuss</h2>
          <ol class="questions">${week.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
        </section>` : ''}

      ${notesHtml(series, week)}

      <nav class="pager" aria-label="Weeks">
        ${prev ? `<a href="#/week/${prev.number}">${icon('back')} Week ${prev.number}</a>` : '<span></span>'}
        ${next ? `<a href="#/week/${next.number}">Week ${next.number} ${icon('chevron')}</a>` : '<span></span>'}
      </nav>
      ${copyright()}`,

    mount(root) {
      mountScripture(root);
      mountTracker(root, ctx);
      mountNotes(root, series, week);
    },
  };
}
