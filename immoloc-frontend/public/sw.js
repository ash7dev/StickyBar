// Service Worker pour ImmoLoc PWA
const CACHE_NAME = 'immoloc-v1';
const RUNTIME_CACHE = 'immoloc-runtime';

// Ressources essentielles à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Installation - précache les ressources essentielles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation - nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - stratégie Network First avec fallback Cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignorer les requêtes API backend
  if (event.request.url.includes('/api/') || event.request.url.includes(process.env.NEXT_PUBLIC_API_URL)) {
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Mettre en cache les réponses réussies
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Fallback sur le cache en cas d'échec réseau
          return cache.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        });
    })
  );
});
