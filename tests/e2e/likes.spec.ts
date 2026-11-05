import { expect, test, type Page } from '@playwright/test';
import { openDesktop, stubLikes } from './helpers';

const likeButton = (page: Page) => page.locator('.status-bar .like-button');

test('reads "Like · 41", likes with a smiling toast and unlikes with a sad face', async ({ page }) => {
  const state = await stubLikes(page);
  await openDesktop(page);
  const button = likeButton(page);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button.locator('.like-count')).toHaveText('Like · 41');
  // The title-bar copy is for phones only.
  await expect(page.locator('#window .title-bar .like-button')).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button.locator('.like-count')).toHaveText('Liked · 42');
  await expect(page.locator('#toast')).toContainText('Thanks for the like');
  // A random happy emoji from the list, on a tinted tile.
  const thanks = (await page.locator('#toast .toast-emoji').textContent()) ?? '';
  expect(['😊', '🥰', '😄', '🤩', '💗', '💖', '✨', '🎉', '🙌', '🌟', '🥳']).toContain(thanks);

  // The like is remembered after a reload; clicking again takes it back without a toast:
  // a sad face stands in for the heart for a moment, then the heart comes back.
  await page.reload();
  await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'true');
  await likeButton(page).click();
  await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
  const sad = likeButton(page).locator('.like-sad');
  await expect(sad).toHaveCount(1);
  expect(['😞', '😢', '😔', '🥺', '😿', '💔']).toContain((await sad.textContent()) ?? '');
  await expect(likeButton(page).locator('.heart-icon')).toHaveCount(0);
  await expect(likeButton(page).locator('.like-count')).toHaveText('Like · 41');
  await expect(page.locator('#toast')).toBeHidden();
  await expect(likeButton(page).locator('.like-sad')).toHaveCount(0, { timeout: 4000 });
  await expect(likeButton(page).locator('.heart-icon')).toBeVisible();
  expect(state.posts).toBe(1);
  expect(state.deletes).toBe(1);
  expect(state.count).toBe(41);
});

test('three waving dots show while the count loads', async ({ page }) => {
  let release!: () => void;
  const loaded = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/likes', async (route) => {
    await loaded;
    await route.fulfill({ json: { count: 41 } });
  });
  await openDesktop(page);
  const button = likeButton(page);
  await expect(button.locator('.like-dots span')).toHaveCount(3);
  await expect(button.locator('.like-count')).toHaveText('Like · ');
  release();
  await expect(button.locator('.like-count')).toHaveText('Like · 41');
  await expect(button.locator('.like-dots')).toHaveCount(0);
});

test('pointing at the pill shows our own tooltip', async ({ page }) => {
  await stubLikes(page);
  await openDesktop(page);
  const button = likeButton(page);
  const tip = page.getByRole('tooltip');
  await expect(button).not.toHaveAttribute('title');
  await expect(tip).toBeHidden();
  await button.hover();
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText('Like this portfolio');
  await button.click();
  await expect(tip).toHaveText('Unlike');
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

test("a like over the network's daily limit is undone", async ({ page }) => {
  await stubLikes(page, { limitReached: true });
  await openDesktop(page);
  await likeButton(page).click();
  await expect(page.locator('#toast')).toContainText('Like not counted');
  await expect(likeButton(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(likeButton(page)).toContainText('41');
});

test('the button stays hidden when the likes service is unavailable', async ({ page }) => {
  await page.route('**/api/likes', (route) => route.fulfill({ status: 503, json: { error: 'down' } }));
  await openDesktop(page);
  await expect(page.locator('.visitor-counter')).toBeVisible();
  await expect(page.locator('.like-button')).toHaveCount(0);
});

test('the API refuses to remove a like without a real id, or from another site', async ({ request }) => {
  const bad = await request.delete('/api/likes', { data: { id: 'everyone' } });
  expect(bad.status()).toBe(400);
  const foreign = await request.delete('/api/likes', {
    data: { id: '00000000-0000-4000-8000-000000000001' },
    headers: { origin: 'https://example.com' },
  });
  expect(foreign.status()).toBe(403);
});
