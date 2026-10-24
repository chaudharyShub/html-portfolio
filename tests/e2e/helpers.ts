import { expect, type Page, type Route } from '@playwright/test';

/** Opens the site and skips the boot screen with a key press. */
export async function openDesktop(page: Page) {
  await page.goto('/');
  // The boot screen listens for keys once it has started typing lines.
  await expect(page.locator('#boot-text')).not.toBeEmpty();
  await page.keyboard.press('Space');
  await expect(page.locator('#boot-screen')).toBeHidden();
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
