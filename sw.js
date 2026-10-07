// Service worker for offline support. Pages are fetched network-first so visitors always get current
// content (fees, wording); the cache is only a fallback when offline.
const CACHE_NAME = 'dynamic-equilibrium-v3';
const urlsToCache = [
  '/',
  '/ru/',
  '/methodology/',
  '/ru/methodology/',
  '/assets/site.css',
  '/assets/site.js',
  '/images/logo-black.svg',
  '/images/logo-white.svg',
  '/images/Alexander.webp',
  '/images/Alexander.jpg',
  '/site.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});
