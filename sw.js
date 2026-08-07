const CACHE_NAME = 'radiosix-v2';
const ASSETS = [
  'radiosix.html',
  'manifest.json',
  'assets/radiosix_logo.png',
  'assets/radiosix_app_icon.png',
  'assets/albums_database.json',
  'assets/songs_list.json'
];

// Install Service Worker and cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first falling back to cache strategy for offline capability
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip external APIs (like YouTube domain calls)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache new successful response
        if (response && response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Return from cache if offline
        return caches.match(event.request);
      })
  );
});
