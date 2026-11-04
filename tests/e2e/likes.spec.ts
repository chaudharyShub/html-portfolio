import { expect, test, type Page, type Route } from '@playwright/test';
import { openDesktop } from './helpers';

/** Replaces /api/likes with an in-memory counter, so tests never touch the real database. */
async function stubLikes(page: Page, { start = 41, postOk = true } = {}) {
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

const likeButton = (page: Page) => page.locator('#like-button');

test('shows the shared like count and adds one like per visitor', async ({ page }) => {
  const state = await stubLikes(page);
  await openDesktop(page);
  const button = likeButton(page);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toContainText('41');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toContainText('42');
  await expect(page.locator('#toast')).toContainText('Thanks for the like');

  // A second click doesn't like again, even after a reload.
  await button.click();
  await expect(page.locator('#toast')).toContainText('already liked');
  await page.reload();
  await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true');
  expect(state.posts).toBe(1);
});

test('a failed like is undone and can be tried again', async ({ page }) => {
  const state = await stubLikes(page, { postOk: false });
  await openDesktop(page);
  const button = likeButton(page);
  await expect(button).toContainText('41');
  await button.click();
  await expect(page.locator('#toast')).toContainText('Like not saved');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toContainText('41');
  expect(state.posts).toBe(1);
});

test('the button stays hidden when the likes service is unavailable', async ({ page }) => {
  await page.route('**/api/likes', (route) => route.fulfill({ status: 503, json: { error: 'down' } }));
  await openDesktop(page);
  await expect(page.locator('.visitor-counter')).toBeVisible();
  await expect(likeButton(page)).toHaveCount(0);
});
