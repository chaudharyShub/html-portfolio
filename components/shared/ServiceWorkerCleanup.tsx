'use client';

import { useEffect } from 'react';

/**
 * The site is no longer an installable app (PWA). Browsers that registered the old offline-cache
 * service worker get it removed here, along with its caches, so they stop being served old files.
 * Can be deleted together with public/sw.js once old visitors have come back (a few months).
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length === 0) return;
        registrations.forEach((registration) => registration.unregister());
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
        }
      })
      .catch(() => {
        // Nothing to clean up.
      });
  }, []);

  return null;
}
