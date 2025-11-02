const CACHE_NAME = 'rebecca-boombox-v1';
const BASE_PATH = '/beccaboom';
const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/images/appicon.webp`,
  `${BASE_PATH}/images/app-192.webp`,
  `${BASE_PATH}/images/app-384.webp`,
  `${BASE_PATH}/images/app-512.webp`,
  // Add other assets you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request).then((response) => {
        // Cache successful network requests
        if (response.ok && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
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