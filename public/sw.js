// Minimal Service Worker for PWA installability and offline caching
const CACHE_NAME = 'baby-tracker-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/icon.svg',
        '/icon-192.png',
        '/icon-512.png',
        '/badge-96.png',
        '/favicon.svg'
      ]);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only our own GET requests. Supabase and fonts go straight to the network.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // The page itself and the version file: always fresh from the server (never the
  // browser's HTTP cache), so a new deploy shows up on the next open.
  if (req.mode === 'navigate' || url.pathname === '/version.json') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Build assets have a content hash in their name, so a cached copy is always correct
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        cached =>
          cached ||
          fetch(req).then(res => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Everything else: network first, cache as offline fallback
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});

// Notifications sent by the server (Supabase "send-reminders"), even when the app is closed
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'בייבי יומן';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      tag: data.tag || 'avigi',
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      dir: 'rtl',
      lang: 'he',
      renotify: true,
      // Stays until handled, so it isn't missed on a locked phone
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
