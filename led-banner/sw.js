const CACHE = 'led-banner-v1';
const ASSETS = [
  '/led-banner/',
  '/led-banner/index.html',
  '/led-banner/manifest.webmanifest',
  '/assets/css/text-tools.css',
  '/assets/css/site-navigation.css',
  '/assets/css/uchiwa-moji.css',
  '/assets/css/led-banner.css',
  '/assets/js/site-navigation.js',
  '/assets/js/analytics.js',
  '/assets/js/led-banner.js',
  '/assets/js/led-display.js',
  '/assets/js/led-state.js',
  '/assets/js/oshi-settings.js',
  '/assets/fonts/uchiwa/dela-gothic-one.woff2',
  '/assets/fonts/uchiwa/mplus-rounded-1c-bold.woff2',
  '/favicon.ico',
  '/moon_icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('led-banner-') && key !== CACHE).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/led-banner/') && !ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response && response.ok && event.request.method === 'GET') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('/led-banner/index.html'));
  }));
});
