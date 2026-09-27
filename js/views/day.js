import { allDays } from '../schedule.js';
import { progress, notes } from '../store.js';
import { config } from '../../config.js';
import { getPassageHtml, esvConfigured, ESV_COPYRIGHT } from '../esv.js';
import { getPassage, passageHtml, passageText, passageChapters, otherTranslations, BSB_NOTICE } from '../bible.js';
import { narratedAudio, speechSupported, speak, stopSpeaking } from '../audio.js';
import { esc, fmtLong, icon } from '../ui.js';

const useESV = () => config.bible === 'ESV' && esvConfigured();

function toggleLabel(done) {
  return done ? `${icon('check')} Read — tap to undo` : `${icon('check')} Mark as read`;
}

export function dayView(ctx, [wn, dn]) {
  const { series, schedule } = ctx;
  const week = schedule[Number(wn) - 1];
  const day = week?.days[Number(dn) - 1];
  if (!day) return null;

  const ordered = allDays(schedule);
  const i = ordered.findIndex((d) => d.id === day.id);
  const prev = ordered[i - 1];
  const next = ordered[i + 1];
  const done = progress.isDone(series.id, day.id);
  const link = (d) => `#/week/${d.weekNumber}/day/${d.index}`;

  return {
    title: day.passage || `Week ${week.number}, Day ${day.index}`,
    html: `
      <a class="back-link" href="#/week/${week.number}">${icon('back')} Week ${week.number}</a>
      <header class="page-head">
        <p class="eyebrow">Week ${week.number} · Day ${day.index} · ${esc(fmtLong(day.date))}</p>
        <h1 class="passage">${esc(day.passage || 'Reading coming soon')}</h1>
        ${day.title ? `<p class="lead">${esc(day.title)}</p>` : ''}
      </header>

      ${day.passage ? scriptureBlock(day.passage) : '<p class="muted">This reading hasn’t been posted yet — check back soon.</p>'}

      ${day.prompt ? `
        <section class="card card-quiet reflect">
          <p class="eyebrow">Reflect</p>
          <p>${esc(day.prompt)}</p>
        </section>` : ''}

      <section class="notes">
        <label class="eyebrow" for="note">My notes <span class="muted">(saved on this device)</span></label>
        <textarea id="note" rows="4" placeholder="What stood out? What will you carry into this week?">${esc(notes.get(series.id, day.id))}</textarea>
      </section>

      <button id="toggle-done" class="btn btn-block ${done ? 'btn-secondary' : 'btn-primary'}" aria-pressed="${done}">${toggleLabel(done)}</button>

      <nav class="pager" aria-label="Readings">
        ${prev ? `<a href="${link(prev)}">${icon('back')} ${esc(prev.passage || 'Previous')}</a>` : '<span></span>'}
        ${next ? `<a href="${link(next)}">${esc(next.passage || 'Next')} ${icon('chevron')}</a>` : '<span></span>'}
      </nav>

      ${day.passage ? copyright() : ''}`,

    mount(root) {
      const btn = root.querySelector('#toggle-done');
      btn.addEventListener('click', () => {
        const now = progress.toggle(series.id, day.id);
        btn.innerHTML = toggleLabel(now);
        btn.setAttribute('aria-pressed', String(now));
        btn.classList.toggle('btn-primary', !now);
        btn.classList.toggle('btn-secondary', now);
        ctx.onProgressChange();
      });

      let t;
      root.querySelector('#note').addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => notes.set(series.id, day.id, e.target.value.trim() ? e.target.value : ''), 400);
      });

      if (day.passage) mountScripture(root, day.passage);
    },
  };
}

export function scriptureBlock(ref) {
  return `
    <section class="listen" id="listen" hidden>
      <p class="eyebrow">${icon('listen')} Listen</p>
      <div id="narrated"></div>
      <button id="speak" class="btn btn-secondary" hidden>${icon('play')} Read it aloud</button>
    </section>
    <article class="scripture" id="scripture" aria-live="polite">
      <p class="muted">Loading ${esc(ref)}…</p>
    </article>
    <p class="also-read">Also read in
      ${otherTranslations(ref).map(([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${name} ${icon('external')}</a>`).join(' · ')}
    </p>`;
}

export const copyright = () => `<p class="copyright">${esc(useESV() ? ESV_COPYRIGHT : BSB_NOTICE)}</p>`;

export function mountScripture(root, ref) {
  const target = root.querySelector('#scripture');
  const fail = (err) => {
    if (!target.isConnected) return;
    target.innerHTML = !navigator.onLine
      ? '<p class="muted">You’re offline, and this book hasn’t been saved on this device yet. Open it once while online and it will work offline after that.</p>'
      : err.message === 'unrecognized-reference'
        ? `<p class="muted">We couldn’t find “${esc(ref)}”. Use the links below to read it.</p>`
        : `<p class="muted">We couldn’t load the passage right now (${esc(err.message)}).</p>`;
  };

  if (useESV()) {
    getPassageHtml(ref).then((html) => { if (target.isConnected) target.innerHTML = html; }, fail);
    return;
  }
  getPassage(ref).then((passage) => {
    if (!target.isConnected) return;
    target.innerHTML = passageHtml(passage);
    setUpListening(root, passage);
  }, fail);
}

function setUpListening(root, passage) {
  const box = root.querySelector('#listen');
  const speakBtn = root.querySelector('#speak');
  if (speechSupported()) {
    box.hidden = false;
    speakBtn.hidden = false;
    let speaking = false;
    const label = () => (speakBtn.innerHTML = speaking ? `${icon('play')} Stop reading` : `${icon('play')} Read it aloud`);
    speakBtn.addEventListener('click', () => {
      speaking = !speaking;
      if (speaking) speak(passageText(passage), { onEnd: () => { speaking = false; label(); } });
      else stopSpeaking();
      label();
    });
    // Stop talking when the reader leaves this screen.
    window.addEventListener('hashchange', stopSpeaking, { once: true });
  }

  narratedAudio(passageChapters(passage)).then((tracks) => {
    if (!tracks.length || !box.isConnected) return;
    box.hidden = false;
    root.querySelector('#narrated').innerHTML = tracks.map((t) => `
      <figure class="track">
        <figcaption>${esc(t.name)} ${t.chapter} <span class="muted">· narrated, whole chapter</span></figcaption>
        <audio controls preload="none" src="${esc(t.url)}"></audio>
      </figure>`).join('');
    speakBtn.classList.add('btn-quiet');
  });
}
