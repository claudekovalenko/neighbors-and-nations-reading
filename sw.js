// Bump VERSION whenever app files change so installed apps pick up the update.
const VERSION = 'v24';
const CACHE = `sermon-series-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/inter.woff2',
  'fonts/newsreader.woff2',
  'js/app.js',
  'js/schedule.js',
  'js/store.js',
  'js/esv.js',
  'js/books.js',
  'js/reference.js',
  'js/media.js',
  'js/reminders.js',
  'js/ui.js',
  'js/views/home.js',
  'js/views/weeks.js',
  'js/scripture.js',
  'js/tracker.js',
  'js/install.js',
  'js/notes.js',
  'js/views/settings.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'series/index.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sermon-series-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Network first for every app file, so people always get the latest
  // version when online; the cache is only the offline copy.
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())),
      ),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url ?? '#/', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const win = wins.find((w) => w.url.startsWith(self.registration.scope));
      if (win) {
        win.navigate(target);
        return win.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
