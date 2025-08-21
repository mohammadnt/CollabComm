// Incrementing OFFLINE_VERSION will kick off the install event and force
// previously cached resources to be updated from the network.
// This variable is intentionally declared and unused.
// Add a comment for your linter if you want:
// eslint-disable-next-line no-unused-vars
const OFFLINE_VERSION = 15;
const CACHE_NAME = 'offline';
const OFFLINE_URL = '/assets/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }
  })());
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes("/static/ewano/assets/ewano-web-toolkit-v1.min.js")) {

    console.log(url.pathname);
    console.log(url.pathname.includes("/static/ewano/assets/ewano-web-toolkit-v1.min.js"));
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(url, {
          mode: "no-cors",
        });
        return networkResponse;
      } catch (error) {
      }
    })());
  } else if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        console.log('Fetch failed; returning offline page instead.', error);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse;
      }
    })());
  }
});
self.addEventListener('notificationclick', function (event) {
  let url = event.notification.data.url + "/chat/" + event.notification.data.target_id;
  if (event.notification.data.target_id === 'cafe-admin') {
    url = event.notification.data.url + '/cafe-admin'
  }

  event.notification.close(); // Android needs explicit close.
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, just focus it.
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
})
// use all the magic of the Angular Service Worker
importScripts('./ngsw-worker.js');
