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

test('Time Machine opens from the Dock and travels through the career', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-timemachine').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Time Machine' });
  await expect(dialog).toBeVisible();
  // Starts at the latest job.
  const ticks = dialog.getByRole('tab');
  const last = (await ticks.count()) - 1;
  await expect(ticks.nth(last)).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('heading', { name: 'Frontend Developer' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Back in time' }).click();
  await expect(ticks.nth(last - 1)).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('tabpanel')).toContainText('Quokka Labs');

  // Arrow keys move along the timeline and keep focus on the selected year.
  await ticks.nth(last - 1).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(ticks.first()).toHaveAttribute('aria-selected', 'true');
  await expect(ticks.first()).toBeFocused();
  await expect(dialog.getByRole('tabpanel')).toContainText('Riviera Home Furnishings');

  // Scrolling down over the snapshots travels forward in time again.
  await dialog.locator('.tm-stack').hover();
  await page.mouse.wheel(0, 120);
  await expect(ticks.nth(1)).toHaveAttribute('aria-selected', 'true');
});

test('the green button takes the Time Machine full screen, Escape leaves it first', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-timemachine').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Time Machine' });
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize()!;

  await dialog.getByRole('button', { name: 'Enter Full Screen' }).click();
  // The box glides to the full screen; wait until it gets there.
  await expect.poll(async () => (await dialog.boundingBox())!.width).toBe(viewport.width);
  await expect.poll(async () => (await dialog.boundingBox())!.height).toBe(viewport.height);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Enter Full Screen' })).toBeVisible();
  await expect.poll(async () => (await dialog.boundingBox())!.width).toBeLessThan(viewport.width);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('About This Developer opens from Shubham HD and the logo menu', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#icon-mycomputer').dblclick();
  const dialog = page.getByRole('dialog', { name: 'About This Developer' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Shubham Chaudhary' })).toBeVisible();
  await expect(dialog.locator('.about-specs')).toContainText('projects shipped');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  await page.locator('#logo-menu-button').click();
  await page.getByRole('menuitem', { name: 'About This Developer' }).click();
  await expect(dialog).toBeVisible();
  // More Info closes it and shows the About section.
  await dialog.getByRole('button', { name: 'More Info…' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#section-about')).toBeVisible();
});

test('Activity Monitor lists the skills, filters, sorts and shows where one is used', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-activity').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Activity Monitor' });
  await expect(dialog).toBeVisible();
  const rows = dialog.locator('.am-table tbody tr');
  await expect(rows).toHaveCount(22);

  await dialog.getByRole('button', { name: 'Backend' }).click();
  await expect(rows).toHaveCount(3);

  await dialog.getByRole('button', { name: 'Process Name' }).click();
  await expect(rows.first()).toContainText('Express.js');

  await dialog.locator('.am-name', { hasText: 'PostgreSQL' }).click();
  await expect(dialog.locator('.am-used')).toContainText('Koru UX');
  await expect(dialog.locator('.am-used')).toContainText('Quokka Labs');

  // Arrow keys move the selection.
  await page.keyboard.press('ArrowUp');
  await expect(dialog.locator('.am-name', { hasText: 'Node.js' })).toBeFocused();
  await expect(dialog.locator('.am-used')).toContainText('RunTheDay');
});

test('a sticky note shows a motto on the desktop and can be dragged', async ({ page }) => {
  await openDesktop(page);
  const note = page.locator('.sticky-note');
  await expect(note).toBeVisible();
  await expect(note.locator('.sticky-note-text')).not.toBeEmpty();
  const before = (await note.boundingBox())!;
  await page.mouse.move(before.x + 40, before.y + 40);
  await page.mouse.down();
  await page.mouse.move(before.x + 140, before.y + 90, { steps: 5 });
  await page.mouse.up();
  const after = (await note.boundingBox())!;
  expect(Math.round(after.x - before.x)).toBe(100);
  expect(Math.round(after.y - before.y)).toBe(50);
});

test('the sticky note switches to another motto on the hour', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T10:59:00') });
  await openDesktop(page);
  const text = page.locator('.sticky-note-text');
  const first = await text.textContent();
  const toNextHour = await page.evaluate(() => {
    const next = new Date();
    next.setMinutes(60, 0, 0);
    return next.getTime() - Date.now();
  });
  await page.clock.runFor(toNextHour + 1_000);
  await expect(text).not.toHaveText(first ?? '');
});
