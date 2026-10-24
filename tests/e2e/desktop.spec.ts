import { expect, test } from '@playwright/test';
import { openDesktop } from './helpers';

test('boot screen finishes on its own in 4-6 seconds', async ({ page }) => {
  await page.goto('/');
  const boot = page.locator('#boot-screen');
  await expect(page.locator('#boot-text')).not.toBeEmpty();
  const start = Date.now();
  await expect(boot).toBeHidden({ timeout: 8_000 });
  const elapsed = Date.now() - start;
  // Timing starts after the first line appears, so allow a little slack on both ends.
  expect(elapsed).toBeGreaterThan(3_500);
  expect(elapsed).toBeLessThan(6_500);
});

test('a key press skips the boot screen and shows the portfolio', async ({ page }) => {
  await openDesktop(page);
  await expect(page.locator('#window')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
});

test('tabs switch the visible sections', async ({ page }) => {
  await openDesktop(page);
  await page.getByRole('tab', { name: 'Projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects\\' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeHidden();
  await page.getByRole('tab', { name: 'Contact' }).click();
  await expect(page.locator('#contact-form')).toBeVisible();
});

test('DOS prompt runs commands and clears', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').click();
  await page.getByRole('menuitem', { name: 'MS-DOS Prompt' }).click();
  const input = page.locator('#dos-input');
  const output = page.locator('#dos-window [role="log"]');
  await expect(input).toBeVisible();

  await input.fill('whoami');
  await input.press('Enter');
  await expect(output).toContainText('Shubham Chaudhary - Full Stack Engineer');

  await input.fill('nonsense');
  await input.press('Enter');
  await expect(output).toContainText('nonsense');

  await input.fill('clear');
  await input.press('Enter');
  await expect(output).not.toContainText('whoami');
});

test('theme choice is saved and applied again after a reload', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').click();
  await page.getByRole('menuitem', { name: 'Display Properties' }).click();
  await page.getByRole('radio', { name: 'Terminal' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');

  await page.reload();
  // Applied by the pre-paint script, before the boot screen is even skipped.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');
});
