// "My notes" for a week: a collapsible box shared by the Today card and the
// week page, so both edit the same note.
import { notes } from './store.js';
import { esc, icon } from './ui.js';

const noteId = (week) => `w${week.number}`;

export function notesHtml(series, week) {
  const text = notes.get(series.id, noteId(week));
  return `
    <details class="notes" ${text ? 'open' : ''}>
      <summary>My notes ${icon('chevron', 'notes-chevron')}</summary>
      <textarea class="note-text" rows="4" aria-label="My notes for week ${week.number}"
        placeholder="What stood out? What do you want to remember?">${esc(text)}</textarea>
      <p class="muted small">Saved on this device.</p>
    </details>`;
}

// Typing saves after a short pause; leaving the screen saves right away.
let pending = null;
const flush = () => {
  pending?.();
  pending = null;
};
window.addEventListener('hashchange', flush);
window.addEventListener('pagehide', flush);

export function mountNotes(root, series, week) {
  const box = root.querySelector('.note-text');
  if (!box) return;
  let t;
  box.addEventListener('input', () => {
    clearTimeout(t);
    pending = () => {
      clearTimeout(t);
      notes.set(series.id, noteId(week), box.value.trim() ? box.value : '');
    };
    t = setTimeout(flush, 400);
  });
}
