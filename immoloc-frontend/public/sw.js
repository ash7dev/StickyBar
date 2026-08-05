// Service Worker pour ImmoLoc PWA
const CACHE_NAME = 'immoloc-v1';
const RUNTIME_CACHE = 'immoloc-runtime';

// Ressources essentielles à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon.svg',
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
  if (event.request.url.includes('/api/')) {
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

// ── Notifications Push PWA ───────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received!', event);

  let data = {
    title: 'Klef - Notification',
    body: 'Vous avez reçu une nouvelle mise à jour sur Klef.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: '/' },
  };

  if (event.data) {
    console.log('[SW] Push has data, parsing...');
    try {
      const parsed = event.data.json();
      console.log('[SW] Parsed push data:', parsed);
      data = parsed;
    } catch (e) {
      console.log('[SW] Failed to parse JSON, using text:', e);
      data.body = event.data.text();
    }
  } else {
    console.log('[SW] No data in push event');
  }

  const options = {
    body: data.body || 'Vous avez reçu une nouvelle mise à jour.',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    sound: data.sound || '/notification.mp3',
    vibrate: data.vibrate !== undefined ? data.vibrate : [200, 100, 200, 100, 200, 100, 400],
    silent: false, // SON TOUJOURS ACTIVÉ pour toutes les notifications
    data: data.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || `klef-${Date.now()}` // Tag unique pour chaque notification
  };

  console.log('[SW] Showing notification with title:', data.title || 'Klef');
  console.log('[SW] Notification options:', options);

  // Envoyer un message aux fenêtres ouvertes pour déclencher le carillon sonore Web Audio API
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    windowClients.forEach((client) => {
      client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND', data });
    });
  });

  event.waitUntil(
    self.registration.showNotification(data.title || 'Klef', options)
      .then(() => console.log('[SW] Notification shown successfully!'))
      .catch(err => console.error('[SW] Error showing notification:', err))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
