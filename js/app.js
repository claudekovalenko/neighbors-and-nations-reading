import { config } from '../config.js';
import { buildSchedule, locate, pickCurrentSeries } from './schedule.js';
import { settings } from './store.js';
import { updateBadge } from './reminders.js';
import { esc } from './ui.js';
import { trackView, trackEvent } from './analytics.js';
import { isStandalone } from './install.js';
import { homeView } from './views/home.js';
import { weeksListView, weekDetailView } from './views/weeks.js';
import { settingsView } from './views/settings.js';

const routes = [
  [/^\/?$/, homeView, 'today'],
  [/^\/weeks$/, weeksListView, 'weeks'],
  [/^\/week\/(\d+)$/, weekDetailView, 'weeks'],
  // Older links to a day or passage page open the week.
  [/^\/week\/(\d+)\/(?:day\/\d+|passage)$/, weekDetailView, 'weeks'],
  [/^\/settings$/, settingsView, 'settings'],
];

const main = document.getElementById('main');
let lastPath = null;

const ctx = {
  index: null,
  all: {}, // id → series, for every series in the index
  series: null,
  schedule: [],
  installPrompt: null,
  rerender: () => render({ keepScroll: true }),
  onProgressChange: () => badge(),
  applySettings,
  switchSeries,
};

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

async function loadAll() {
  const loaded = await Promise.all(
    ctx.index.series.map((e) => fetchJSON(e.path).then((s) => [e.id, s], () => null)),
  );
  ctx.all = Object.fromEntries(loaded.filter(Boolean));
  if (!Object.keys(ctx.all).length) throw new Error('No series could be loaded');
}

// No saved choice means "whatever is being preached now".
function chooseSeries() {
  const saved = settings.get().seriesId;
  if (saved && ctx.all[saved]) return saved;
  const list = Object.entries(ctx.all).map(([id, s]) => ({ id, schedule: buildSchedule(s) }));
  return pickCurrentSeries(list) ?? (ctx.all[ctx.index.active] ? ctx.index.active : list[0].id);
}

function useSeries(id) {
  ctx.series = ctx.all[id];
  ctx.schedule = buildSchedule(ctx.series);
  const accent = ctx.series.theme?.accent;
  const root = document.documentElement.style;
  if (accent) root.setProperty('--series-accent', accent);
  else root.removeProperty('--series-accent');
}

function switchSeries(id) {
  settings.set({ seriesId: id || null });
  useSeries(chooseSeries());
  location.hash = '#/';
  render();
}

function applySettings() {
  document.documentElement.dataset.textSize = settings.get().textSize;
}

function render({ keepScroll = false } = {}) {
  const path = location.hash.replace(/^#/, '') || '/';
  let view = null;
  let tab = null;
  for (const [re, fn, t] of routes) {
    const m = path.match(re);
    if (m) {
      view = fn(ctx, m.slice(1));
      tab = t;
      break;
    }
  }
  if (!view) {
    view = {
      title: 'Not found',
      html: '<header class="page-head"><h1>Page not found</h1></header><a class="btn btn-secondary" href="#/">Go to Today</a>',
    };
  }

  main.innerHTML = view.html;
  view.mount?.(main);
  document.title = `${view.title} · ${config.appName}`;
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (!keepScroll && path !== lastPath) {
    main.scrollTo(0, 0); // main is the scrolling area, not the window
    main.focus({ preventScroll: true });
    if (lastPath !== null) {
      main.classList.remove('page-enter');
      void main.offsetWidth; // restart the ease-in
      main.classList.add('page-enter');
    }
  }
  if (path !== lastPath) trackView(path);
  lastPath = path;
}

function badge() {
  if (!ctx.series) return;
  updateBadge({ series: ctx.series, readings: locate(ctx.schedule).todayReadings });
}

// iPhone home-screen installs made before v16 kept the old translucent
// status bar (iOS locks it at install), which on iOS 26 leaves a strip under
// the tab bar. The new setting gives no top safe area, so a top inset in a
// home-screen app means an old install that should be re-added.
function detectStaleInstall() {
  if (navigator.standalone !== true) return false;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;height:env(safe-area-inset-top, 0px)';
  document.body.append(probe);
  const top = probe.offsetHeight;
  probe.remove();
  return top > 0;
}

async function start() {
  // Opened from the home-screen icon: a rough count of people who installed it.
  if (isStandalone()) trackEvent('opened-from-home-screen');
  ctx.staleInstall = detectStaleInstall();
  applySettings();
  try {
    ctx.index = await fetchJSON(config.seriesIndex);
    await loadAll();
    useSeries(chooseSeries());
  } catch (err) {
    main.innerHTML = `<h1>Couldn’t load the series</h1><p class="muted">${esc(err.message)}</p><p>Check your connection and try again.</p>`;
    return;
  }
  window.addEventListener('hashchange', () => render());
  main.addEventListener('animationend', () => main.classList.remove('page-enter'));
  // Tabs: highlight the tapped tab right away; tapping the current tab
  // scrolls back to the top, like other apps.
  document.querySelector('.tabbar').addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const here = (location.hash || '#/') === a.getAttribute('href');
    if (here) {
      e.preventDefault();
      main.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.querySelectorAll('.tabbar a').forEach((t) => {
      if (t === a) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
  });
  // Lets iPhone show the :active press effect.
  document.addEventListener('touchstart', () => {}, { passive: true });
  render();
  badge();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // The date may have rolled over — possibly into the next series.
      const id = chooseSeries();
      if (id !== ctx.series.id) useSeries(id);
      render({ keepScroll: true });
      badge();
    }
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  ctx.installPrompt = e;
  if (['', '#', '#/', '#/settings'].includes(location.hash)) ctx.rerender();
});

window.addEventListener('appinstalled', () => {
  trackEvent('installed');
  ctx.installPrompt = null;
  ctx.rerender();
});

if ('serviceWorker' in navigator) {
  // When an update takes over, reload once so it's used right away.
  if (navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  }
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  // Home-screen apps often resume instead of relaunching; check for updates then too.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {});
    }
  });
}

start();
