import { expect, test, type Page } from '@playwright/test';
import { openDesktop } from './helpers';

/** Phones get the iOS layout: full-screen apps, a Home Screen, sheets and a dock. */

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

async function box(page: Page, selector: string) {
  const b = await page.locator(selector).boundingBox();
  expect(b).toBeTruthy();
  return b!;
}

async function goHome(page: Page) {
  await page.locator('#window .title-home').tap();
  await expect(page.locator('#window')).toBeHidden();
}

test('the portfolio opens as a full-screen app', async ({ page }) => {
  await openDesktop(page);
  await noHorizontalScroll(page);
  await page.waitForTimeout(700); // let the open animation settle
  const win = await box(page, '#window');
  const viewport = page.viewportSize()!;
  expect(Math.round(win.x)).toBe(0);
  expect(Math.round(win.y)).toBe(0);
  expect(Math.round(win.width)).toBe(viewport.width);
  expect(Math.round(win.height)).toBe(viewport.height);
  // macOS window buttons are hidden on phones.
  await expect(page.locator('#window .traffic-lights')).toBeHidden();
});

test('the tab bar sits at the bottom and switches sections', async ({ page }) => {
  await openDesktop(page);
  const bar = await box(page, '#window .tab-bar-wrap');
  expect(bar.y + bar.height).toBeCloseTo(page.viewportSize()!.height, 0);
  await page.getByRole('tab', { name: 'Contact' }).tap();
  await expect(page.locator('#contact-form')).toBeVisible();
});

test('the Home button goes to the Home Screen and the dock reopens the app', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await expect(page.locator('#icon-mycomputer')).toBeVisible();
  await expect(page.locator('#dock-more')).toBeVisible();
  await page.locator('#dock-portfolio').tap();
  await expect(page.locator('#window')).toBeVisible();
});

test('tapping the title bar scrolls the app back to the top', async ({ page }) => {
  await openDesktop(page);
  const app = page.locator('#window');
  await app.evaluate((el) => el.scrollTo({ top: 600 }));
  await expect.poll(() => app.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.locator('#window .title-text').tap();
  await expect.poll(() => app.evaluate((el) => el.scrollTop)).toBe(0);
  // The app is still open: only the Home button leaves it.
  await expect(app).toBeVisible();
});

test('the tab bar does not cover the end of the page', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#window').evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  const footer = await box(page, '#window .status-bar');
  const bar = await box(page, '#window .tab-bar-wrap');
  expect(footer.y + footer.height).toBeLessThanOrEqual(bar.y + 1);
});

test('a single tap opens a Home Screen icon', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#icon-mycomputer').tap();
  await expect(page.getByText('Shubham OS v3.0')).toBeVisible();
});

test('the More button opens an action sheet with Cancel on screen', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#dock-more').tap();
  const cancel = page.getByRole('menuitem', { name: 'Cancel' });
  await expect(cancel).toBeVisible();
  await page.waitForTimeout(600); // let the sheet finish sliding up
  const c = (await cancel.boundingBox())!;
  expect(c.y + c.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await cancel.tap();
  await expect(page.locator('#logo-menu')).toBeHidden();
});

test('Settings opens as a bottom sheet', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#dock-settings').tap();
  const sheet = page.getByRole('dialog', { name: 'System Settings' });
  await expect(sheet).toBeVisible();
  // Let the slide-up finish before measuring.
  await page.waitForTimeout(600);
  const b = (await sheet.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(b.x).toBe(0);
  expect(b.width).toBe(viewport.width);
  expect(Math.round(b.y + b.height)).toBe(viewport.height);
  await sheet.getByRole('button', { name: 'Close' }).first().tap();
  await expect(sheet).toBeHidden();
});

test('the Home Screen has a sticky note widget and the Time Machine app', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await expect(page.locator('.sticky-note')).toBeVisible();
  await page.locator('#icon-timemachine').tap();
  await expect(page.getByRole('dialog', { name: 'Time Machine' })).toBeVisible();
  await noHorizontalScroll(page);
});
