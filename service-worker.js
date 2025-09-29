// Basic service worker for offline caching of the Site Work Tracker app.
// This script caches the core assets so that the application continues to
// function when the device is offline or has an unreliable connection.

// Update the cache name whenever you deploy a new version of the app.
// Changing this value causes the old cache to be discarded and fresh
// resources to be fetched on the next visit. Increment the version
// whenever you update application assets.
const CACHE_NAME = 'site-work-cache-v2';

// List of files to cache during the install event. If you add more
// resources to your app (e.g. images or other scripts) include them here.
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event: cache defined assets
self.addEventListener('install', (event) => {
  // Skip the waiting phase and activate the new service worker immediately.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event: respond with cached resources when available or fall back
// to the network. If the request isn't found in the cache, it is fetched
// from the network and then stored for future use.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Save a copy to cache for next time (only for GET requests)
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    })
  );
});

// Activate event: clean up any old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
    // Take control of uncontrolled clients as soon as the new service worker
    // activates. This ensures that the updated version of the app is used
    // immediately without requiring a full page reload.
    .then(() => self.clients.claim())
  );
});