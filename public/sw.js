/*
 * Offline support for Shubham OS.
 * - Page navigations: network first, falling back to the cached page when offline
 *   (so a new deploy is picked up immediately instead of serving stale HTML forever).
 * - Hashed Next.js build assets (/_next/static): cache first (their URLs change per build).
 * - Other same-origin files (resume, icons, wallpapers): stale-while-revalidate.
 */
const CACHE_NAME = 'shubham-os-v2';
const PRECACHE = [
  '/',
  '/Shubham_resume.pdf',
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/og-image.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

function putInCache(request, response) {
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => putInCache(request, response))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => cached);
      return cached || network;
    }),
  );
});
