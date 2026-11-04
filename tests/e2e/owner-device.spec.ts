import { expect, test } from '@playwright/test';
import { isOwnerDevice, sha256Hex } from '@/lib/owner-device';

// Runs in Node against a stand-in browser, with a test token (the real one is never in the repo).
const TOKEN = 'test-token-for-specs';

function fakeBrowser(hash: string) {
  const store = new Map<string, string>();
  const alerts: string[] = [];
  const location = { hash, pathname: '/', search: '' };
  Object.assign(globalThis, {
    window: {
      location,
      history: { replaceState: () => (location.hash = '') },
      alert: (message: string) => alerts.push(message),
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    },
  });
  return { store, alerts, location };
}

test.afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

test("the secret link marks the owner's browser, and .on undoes it", async () => {
  const hash = await sha256Hex(TOKEN);
  const browser = fakeBrowser(`#${TOKEN}`);
  expect(await isOwnerDevice(hash)).toBe(true);
  expect(browser.location.hash).toBe(''); // taken out of the address bar
  expect(browser.alerts).toHaveLength(1);

  // Later visits without the link stay excluded.
  expect(await isOwnerDevice(hash)).toBe(true);

  browser.location.hash = `#${TOKEN}.on`;
  expect(await isOwnerDevice(hash)).toBe(false);
  expect(browser.store.size).toBe(0);
  expect(await isOwnerDevice(hash)).toBe(false);
});

test('a wrong token or a hand-made storage value does not exclude anyone', async () => {
  const hash = await sha256Hex(TOKEN);
  const browser = fakeBrowser('#notrack');
  expect(await isOwnerDevice(hash)).toBe(false);
  expect(browser.location.hash).toBe('#notrack');
  expect(browser.alerts).toHaveLength(0);
  expect(browser.store.size).toBe(0);

  browser.location.hash = '';
  browser.store.set('shubhamOsDevice', 'true');
  expect(await isOwnerDevice(hash)).toBe(false);
});
