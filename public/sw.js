/*
 * The site used to be an installable app (PWA) with an offline cache; that was removed in Nov 2026.
 * Browsers that still have the old service worker fetch this file on their next visit: it deletes
 * the old caches and unregisters itself, so every request goes to the network again.
 * Can be deleted once old visitors have had time to come back (a few months).
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister()),
  );
});
