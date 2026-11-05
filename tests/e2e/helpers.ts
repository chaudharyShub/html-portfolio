import { expect, type Page, type Route } from '@playwright/test';

/** Opens the site, skips the startup screen with a key press and waits for the window to open. */
export async function openDesktop(page: Page) {
  await page.goto('/');
  // The startup screen listens for keys once it shows its first step.
  await expect(page.locator('#boot-text')).not.toBeEmpty();
  await page.keyboard.press('Space');
  await expect(page.locator('#boot-screen')).toBeHidden();
  // The portfolio window springs open; let it settle so measurements are final.
  await expect.poll(() => page.locator('#window').evaluate((el) => el.getAnimations().length)).toBe(0);
}

/**
 * Replaces Web3Forms with a stub so tests never send real mail. Returns a counter of how many
 * submissions reached it.
 */
export async function stubWeb3Forms(page: Page, { ok = true, delayMs = 150 } = {}) {
  const sent = { count: 0 };
  await page.route(/web3forms\.com/, async (route: Route) => {
    sent.count++;
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: ok ? 200 : 500,
      contentType: 'application/json',
      body: JSON.stringify({ success: ok }),
    });
  });
  return sent;
}

/** Replaces /api/likes with an in-memory counter, so tests never touch the real database. */
export async function stubLikes(page: Page, { start = 41, postOk = true } = {}) {
  const state = { count: start, posts: 0 };
  await page.route('**/api/likes', async (route: Route) => {
    if (route.request().method() === 'POST') {
      state.posts++;
      if (!postOk) return route.fulfill({ status: 503, json: { error: 'down' } });
      state.count++;
      return route.fulfill({ json: { count: state.count, counted: true } });
    }
    return route.fulfill({ json: { count: state.count } });
  });
  return state;
}
