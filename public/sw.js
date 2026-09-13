const STATIC_CACHE = 'arc-static-v1';
const API_CACHE = 'arc-api-v1';
const APP_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => ![STATIC_CACHE, API_CACHE].includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // Bypass cache completely for API routes and websockets (supabase)
  const isApiRequest = requestUrl.pathname.startsWith('/api/remote/')
    || requestUrl.pathname.includes('/rest/v1/')
    || requestUrl.pathname.includes('/realtime/v1/');

  if (isApiRequest) {
    // Force network fetch without caching for real-time and API to prevent stale data
    if (requestUrl.pathname.includes('/realtime/v1/')) {
       // Websocket upgrade requests shouldn't really reach here, but just in case
       return;
    }
    event.respondWith(
       fetch(event.request).catch(async () => {
         // Fallback to cache only if strictly necessary
         const cache = await caches.open(API_CACHE);
         return cache.match(event.request);
       })
    );
    return;
  }

  // Stale-While-Revalidate for main UI assets
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
           if (networkResponse.ok) {
             caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, networkResponse.clone());
             });
           }
           return networkResponse;
        }).catch(() => null);

        return cached || fetchPromise;
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'AXiM Alert', {
      body: data.body || 'New executive action requires review.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [100, 50, 100],
      tag: data.task_id || 'axim-alert',
      data: {
        url: `/#hitl?task_id=${data.task_id || ''}`,
        task_id: data.task_id
      },
      actions: [
        { action: 'inspect', title: 'Inspect action' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existingClient = windowClients.find((client) =>
          client.url.startsWith(self.location.origin)
        );
        return existingClient
          ? existingClient.focus()
          : self.clients.openWindow(targetUrl);
      })
  );
});
