/*
  Simple service worker to enable offline support for the Site Work Tracker.

  The cache name is bumped whenever significant updates are released so that
  clients fetch fresh versions of files. Update CACHE_NAME to a new string
  whenever you change static assets (HTML, CSS, JS). See:
  https://developers.google.com/web/fundamentals/primers/service-workers
*/

const CACHE_NAME = 'swt-v7';

// List of files to cache for offline use. If you add new static resources
// (scripts, stylesheets, images) you should add them here as well.
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'auth.js',
  'ric3-telecom-vaults.js',
  'ric3-telecom-editor.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// Install event: cache all static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event: remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache, falling back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});