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
  await page.locator('#logo-menu-button').click();
  await page.getByRole('menuitem', { name: 'Terminal' }).click();
  const input = page.locator('#terminal-input');
  const output = page.locator('#terminal-window [role="log"]');
  await expect(input).toBeVisible();

  await input.fill('whoami');
  await input.press('Enter');
  await expect(output).toContainText('Shubham Chaudhary - Full Stack Engineer');

  await input.fill('nonsense');
  await input.press('Enter');
  await expect(output).toContainText('zsh: command not found: nonsense');

  await input.fill('clear');
  await input.press('Enter');
  await expect(output).not.toContainText('whoami');
});

test('the default appearance is Light, even on a device set to dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openDesktop(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(29, 29, 31)');
});

test('appearance choice is saved and applied again after a reload', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#logo-menu-button').click();
  await page.getByRole('menuitem', { name: 'System Settings' }).click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  // Applied by the pre-paint script, before the boot screen is even skipped.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('Larger Text switches on, and stays on after a reload', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-settings').click({ force: true });
  const html = page.locator('html');
  await page.getByRole('switch', { name: /Larger Text/ }).check();
  await expect(html).toHaveAttribute('data-larger-text', '');
  await expect(page.locator('#section-about')).toHaveCSS('zoom', '1.15');

  await page.reload();
  // Applied by the pre-paint script, so there is no flash of small text.
  await expect(html).toHaveAttribute('data-larger-text', '');
});

test('double-clicking the title bar zooms the window, a single click leaves it alone', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  const title = win.locator('.title-text');
  await title.dblclick();
  await expect(win).toHaveClass(/maximized/);
  // A single click on a zoomed window's title bar must not restore it.
  await title.click();
  await page.waitForTimeout(400);
  await expect(win).toHaveClass(/maximized/);
  await title.dblclick();
  await expect(win).not.toHaveClass(/maximized/);
});

test('minimizing sends the window to the Dock and the Dock icon brings it back', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  await win.getByRole('button', { name: 'Minimize', exact: true }).click();
  await expect(win).toBeHidden();
  // The Dock magnifies under the pointer, so don't wait for the icon to hold still.
  await page.locator('#dock-portfolio').click({ force: true });
  await expect(win).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
  // The genie animation plays on temporary copies; none may be left behind.
  await expect(page.locator('.genie-layer')).toHaveCount(0);
  await expect(win).toHaveCSS('visibility', 'visible');
  await expect(win).toHaveCSS('opacity', '1');
});

test('zoom fills the screen and restores the window to where it was', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  // Let the opening animation settle before measuring.
  await expect.poll(() => win.evaluate((el) => el.getAnimations().length)).toBe(0);
  const before = await win.boundingBox();
  await win.getByRole('button', { name: 'Maximize', exact: true }).click();
  await expect(win).toHaveClass(/maximized/);
  // The zoom glides the real frame; wait until it reaches the full width.
  await expect.poll(async () => (await win.boundingBox())?.width).toBe(page.viewportSize()?.width);
  await win.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(win).not.toHaveClass(/maximized/);
  await expect.poll(async () => await win.boundingBox()).toEqual(before);
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
