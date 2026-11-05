import { expect, test } from '@playwright/test';

/** The site is no longer an installable app (PWA): no manifest, no offline cache. */

test('the page has no web app manifest', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).not.toContain('rel="manifest"');
  expect((await request.get('/manifest.webmanifest')).status()).toBe(404);
});

test('sw.js only removes the old offline cache', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).toContain('unregister()');
  expect(sw).not.toContain("addEventListener('fetch'");
});

test('an old service worker is removed when the page opens', async ({ page }) => {
  await page.goto('/');
  // Pretend this browser still has the old service worker and its cache.
  await page.evaluate(async () => {
    await caches.open('shubham-os-v6').then((cache) => cache.put('/old', new Response('old')));
    await navigator.serviceWorker.register('/sw.js');
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
    .toBe(0);
  await expect.poll(() => page.evaluate(() => caches.keys())).toEqual([]);
});
