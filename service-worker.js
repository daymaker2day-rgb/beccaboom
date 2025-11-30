const CACHE_NAME = 'rebecca-boombox-v3';
const BASE_PATH = '/beccaboom';
const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  // Icon images
  `${BASE_PATH}/images/appicon.webp`,
  `${BASE_PATH}/images/app-192.webp`,
  `${BASE_PATH}/images/app-384.webp`,
  `${BASE_PATH}/images/app-512.webp`,
  // Profile and logo images
  `${BASE_PATH}/images/120r.png`,
  `${BASE_PATH}/images/app-logo.png`,
  `${BASE_PATH}/images/app-logo.svg`,
];

self.addEventListener('install', (event) => {
  // Activate the new service worker immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  try {
    const requestUrl = new URL(event.request.url);
    const playlistPaths = [
      `${BASE_PATH}/videos/index.json`,
      '/videos/index.json'
    ];
    if (playlistPaths.some(p => requestUrl.pathname.endsWith(p) || requestUrl.pathname === p)) {
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
    // ignore and fall through to cache-first
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) return response;
      return fetch(event.request).then((networkResponse) => {
        // Cache successful network requests
        if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => caches.match(`${BASE_PATH}/index.html`));
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately so the new SW starts controlling pages
  event.waitUntil((async () => {
    await clients.claim();
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    );
  })());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: `${BASE_PATH}/images/appicon.webp`,
      badge: `${BASE_PATH}/images/appicon.webp`
    };
    event.waitUntil(
      self.registration.showNotification('Rebecca\'s Boombox', options)
    );
  }
});