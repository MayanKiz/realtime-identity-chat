const CACHE_NAME = 'secret-chat-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isAppDocument = event.request.mode === 'navigate' || requestUrl.pathname === '/' || requestUrl.pathname.endsWith('.html');

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && (isAppDocument || requestUrl.pathname.startsWith('/assets/'))) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then((clientList) => {
    const existing = clientList.find((client) => 'focus' in client);
    if (existing) return existing.focus();
    return clients.openWindow ? clients.openWindow('/') : undefined;
  }));
});
