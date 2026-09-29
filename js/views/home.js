import { locate, daysUntil, sameDay } from '../schedule.js';
import { esc, ref, fmtLong, videoBlock, spotifyBlock } from '../ui.js';
import { scriptureBlock, mountScripture, copyright } from '../scripture.js';
import { trackerHtml, mountTracker } from '../tracker.js';
import { notesHtml, mountNotes } from '../notes.js';
import { weekHeading } from './weeks.js';

export function homeView(ctx) {
  const { series, schedule } = ctx;
  const loc = locate(schedule);
  const parts = [];

  if (ctx.staleInstall) {
    parts.push(`
      <section class="card reinstall-note">
        <p><strong>One quick fix:</strong> delete this app from your home screen, then open the link in Safari and tap <strong>Share → Add to Home Screen</strong>. This fixes the space under the bottom bar.</p>
      </section>`);
  }

  parts.push(`
    <header class="hero">
      <h1>${esc(series.title)}</h1>
      ${series.subtitle ? `<p class="hero-sub">${esc(series.subtitle)}</p>` : ''}
      <span class="rule" aria-hidden="true"></span>
      <p class="hero-date">${esc(fmtLong(loc.today))}</p>
    </header>`);

  const cw = loc.currentWeek;
  const gap = cw ? daysUntil(cw.sermonDate) : 0;

  if (cw && gap > 7 && loc.status === 'active') {
    // Between parts of the series (e.g. Romans pauses for Advent).
    parts.push(`
      <section class="card">
        <p class="eyebrow">${esc(series.title)} is on a break</p>
        <h2>Back ${esc(fmtLong(cw.sermonDate))}</h2>
        ${cw.passage ? `<p>Starting with ${esc(ref(cw.passage))}.</p>` : ''}
      </section>`);
  } else if (cw) {
    const label = sameDay(cw.sermonDate, loc.today)
      ? 'Today'
      : loc.status === 'upcoming' && cw.number === 1 ? 'Starts' : 'This week';
    parts.push(`
      <section class="card card-feature">
        <p class="card-meta"><span class="eyebrow">${label}</span><span class="meta-date">${esc(fmtLong(cw.sermonDate))}</span></p>
        <h2 class="passage">${esc(ref(cw.passage) || weekHeading(cw))}</h2>
        ${cw.title && cw.passage ? `<p class="lead">${esc(cw.title)}</p>` : ''}
        ${cw.passage ? scriptureBlock(cw.passage) : ''}
        ${trackerHtml(series, cw, loc.today)}
        ${notesHtml(series, cw)}
        ${videoBlock(cw.videos?.before, 'A word from our pastor')}
      </section>`);
  }

  const lw = loc.lastWeek;
  if (lw && (lw.podcastEpisodeUrl || lw.videos?.after)) {
    parts.push(`
      <section class="card">
        <p class="eyebrow">Last week’s message</p>
        <h2>${esc(weekHeading(lw))}</h2>
        ${spotifyBlock(lw.podcastEpisodeUrl)}
        ${videoBlock(lw.videos?.after, 'After the message')}
      </section>`);
  }

  if (loc.status === 'complete') {
    parts.push(`
      <section class="card">
        <p class="eyebrow">Series complete</p>
        <p>Every week stays here — <a href="#/weeks">look back through the series</a>.</p>
      </section>`);
  }

  parts.push(copyright());

  return {
    title: series.title,
    html: parts.join(''),
    mount(root) {
      mountScripture(root);
      mountTracker(root, ctx);
      if (cw) mountNotes(root, series, cw);
    },
  };
}
