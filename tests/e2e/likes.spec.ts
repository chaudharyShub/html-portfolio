import { expect, test, type Page } from '@playwright/test';
import { openDesktop, stubLikes } from './helpers';

const likeButton = (page: Page) => page.locator('.status-bar .like-button');

test('shows the shared like count and adds one like per visitor', async ({ page }) => {
  const state = await stubLikes(page);
  await openDesktop(page);
  const button = likeButton(page);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toContainText('41');
  // The title-bar copy is for phones only.
  await expect(page.locator('#window .title-bar .like-button')).toBeHidden();

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
  await expect(page.locator('.like-button')).toHaveCount(0);
});
