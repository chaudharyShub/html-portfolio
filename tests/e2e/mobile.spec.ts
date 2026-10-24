import { expect, test, type Page } from '@playwright/test';
import { openDesktop } from './helpers';

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

async function insideViewport(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport).toBeTruthy();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test('the page fits a phone screen', async ({ page }) => {
  await openDesktop(page);
  await noHorizontalScroll(page);
  await insideViewport(page, '#window');
});

test('window buttons are big enough to tap', async ({ page }) => {
  await openDesktop(page);
  for (const name of ['Minimize', 'Maximize', 'Close']) {
    const box = await page.locator('#window').getByRole('button', { name, exact: true }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
});

test('taskbar stays on one line with the DOS prompt open', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').tap();
  await page.getByRole('menuitem', { name: 'MS-DOS Prompt' }).tap();
  await expect(page.locator('#taskbar-dos-btn')).toBeVisible();
  await insideViewport(page, '#dos-window');
  for (const id of ['#start-button', '#taskbar-window-btn', '#taskbar-dos-btn', '#clock-behind']) {
    await insideViewport(page, id);
    const box = await page.locator(id).boundingBox();
    expect(box?.height).toBeLessThanOrEqual(32);
  }
});

test('dialogs keep a margin from the screen edges', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').tap();
  await page.getByRole('menuitem', { name: 'Display Properties' }).tap();
  const box = await page.getByRole('dialog', { name: 'Display Properties' }).boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box?.x).toBeGreaterThanOrEqual(4);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width - 4);
});

test('a single tap opens a desktop icon', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#window').getByRole('button', { name: 'Minimize', exact: true }).tap();
  await page.locator('#icon-mycomputer').tap();
  await expect(page.getByText('Shubham OS v3.0')).toBeVisible();
});
