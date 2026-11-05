import { expect, test } from '@playwright/test';
import { openDesktop, stubLikes } from './helpers';

test('the notification slides back out instead of vanishing', async ({ page }) => {
  await stubLikes(page);
  await openDesktop(page);
  await page.locator('.status-bar .like-button').click();
  const toast = page.locator('.toast-inner');
  await expect(toast).toContainText('Thanks for the like');
  // Let it finish sliding in.
  await expect.poll(() => toast.evaluate((el) => el.getAnimations().length)).toBe(0);

  // Follow the banner until it is gone: it should move right on its way out, not just disappear.
  const { startX, lastX } = await page.evaluate(async () => {
    const el = document.querySelector('.toast-inner')!;
    const startX = el.getBoundingClientRect().x;
    let lastX = startX;
    const t0 = performance.now();
    while (document.contains(el) && performance.now() - t0 < 8000) {
      lastX = el.getBoundingClientRect().x;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    return { startX, lastX };
  });
  expect(lastX).toBeGreaterThan(startX + 100);
  await expect(toast).toHaveCount(0);
});
