// Service Worker for CA3 Communications Reviewer — v4 (offline shell + manifest icons)
const CACHE = 'ca3-v4';
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Navigation: network-first, fall back to cached index (offline app shell)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        })
        .catch(function () {
          return caches.match('./index.html').then(function (hit) {
            return hit || new Response('Offline — open the app once online to cache it.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          });
        })
    );
    return;
  }

  // Static assets: cache-first, then network
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request)
        .then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          }
          return res;
        })
        .catch(function () {
          return caches.match('./index.html');
        });
    })
  );
});
