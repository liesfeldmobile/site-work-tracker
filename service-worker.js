
const CACHE_NAME = 'swt-v3'; // bump when shipping CSS/layout fixes
const ASSETS = [
  '/', '/index.html', '/styles.css', '/app.js',
  '/supabase-auth.js', '/ric3-telecom-editor.js', '/ric3-telecom-vaults.js',
  '/manifest.json', '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
