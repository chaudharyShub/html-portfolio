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
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeHidden();
  await page.getByRole('tab', { name: 'Contact' }).click();
  await expect(page.locator('#contact-form')).toBeVisible();
});

test('Terminal runs commands and clears', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').click();
  await page.getByRole('menuitem', { name: 'Terminal' }).click();
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

test('appearance choice is saved and applied again after a reload', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#start-button').click();
  await page.getByRole('menuitem', { name: 'System Settings' }).click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  // Applied by the pre-paint script, before the boot screen is even skipped.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('minimizing sends the window to the Dock and the Dock icon brings it back', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  await win.getByRole('button', { name: 'Minimize', exact: true }).click();
  await expect(win).toBeHidden();
  // The Dock magnifies under the pointer, so don't wait for the icon to hold still.
  await page.locator('#taskbar-window-btn').click({ force: true });
  await expect(win).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
});

test('the close button asks before "quitting" and then minimizes', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  await win.getByRole('button', { name: 'Close', exact: true }).click();
  const alert = page.getByRole('alertdialog', { name: 'Are you sure you want to quit Shubham?' });
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Quit' }).click();
  await expect(win).toBeHidden();
});
