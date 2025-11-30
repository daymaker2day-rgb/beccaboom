const CACHE_NAME = 'rebecca-boombox-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/120r.png',
  '/images/appicon.webp',
  '/images/app-logo.png',
  '/images/app-logo.svg',
  '/assets/'
];

self.addEventListener('install', event => {
  // Activate new service worker immediately on install
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  try {
    const requestUrl = new URL(event.request.url);
    // Network-first for the playlist so new songs are available quickly
    if (requestUrl.pathname.endsWith('/videos/index.json') || requestUrl.pathname.endsWith('/videos/index.json/')) {
      event.respondWith(
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            }
            return networkResponse;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }
  } catch (e) {
    // ignore URL parsing errors and fall back to default behavior
  }

  // Default cache-first strategy for other assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => caches.match('/index.html'));
      })
  );
});

self.addEventListener('activate', event => {
  // Take control of the clients as soon as the worker activates
  event.waitUntil((async () => {
    await clients.claim();
    const cacheWhitelist = [CACHE_NAME];
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    );
  })());
});
