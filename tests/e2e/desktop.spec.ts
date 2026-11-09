import { expect, test, type Page } from '@playwright/test';
import { GAME_OVER_LINES } from '../../lib/debug-runner';
import { openDesktop, stubTopScore } from './helpers';

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
  const cloudPrep = page.locator('.project-card', { hasText: 'CloudPrep' });
  await expect(cloudPrep.locator('.status-badge')).toHaveText('Completed');
  await expect(cloudPrep.getByRole('link', { name: /CloudPrep live site/ })).toHaveAttribute(
    'href',
    'https://aws-cloud-prepare.vercel.app',
  );
  await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeHidden();

  await page.getByRole('tab', { name: 'Skills' }).click();
  await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeHidden();

  await page.getByRole('tab', { name: 'Contact' }).click();
  await expect(page.locator('#contact-form')).toBeVisible();
});

test('projects are grouped by company, then personal projects', async ({ page }) => {
  await openDesktop(page);
  await page.getByRole('tab', { name: 'Projects' }).click();
  const groups = page.locator('#section-projects .project-group');
  await expect(groups.locator('.project-group-title')).toHaveText(['Koru UX', 'Quokka Labs', 'Personal Projects']);

  const quokka = page.getByRole('region', { name: 'Quokka Labs' });
  await expect(quokka.locator('.project-group-meta')).toHaveText('Software Engineer · Sept 2022 - March 2026');
  await expect(quokka.locator('.project-name')).toHaveText(['RunTheDay (RTD)', 'MDM Desktop Application', 'SportZentric']);

  const personal = page.getByRole('region', { name: 'Personal Projects' });
  await expect(personal.locator('.project-group-meta')).toHaveCount(0);
  await expect(personal.locator('.project-name')).toHaveText(['CloudPrep', 'Frontend Interview Prep']);
  await expect(personal.getByRole('link', { name: /Frontend Interview Prep live site/ })).toHaveAttribute(
    'href',
    'https://frontend-interview-prepare.vercel.app',
  );
});

test('the Shubham Works pill sits in the bottom-left corner and opens the other sites', async ({ page }) => {
  await openDesktop(page);
  const footer = page.locator('.made-by');
  const pill = footer.getByRole('button', { name: 'A Shubham Works project' });
  await expect(pill).toBeVisible();
  const b = (await pill.boundingBox())!;
  expect(b.x).toBeLessThan(40);
  expect(b.y + b.height).toBeGreaterThan(page.viewportSize()!.height - 120);
  // It sits behind windows, like the desktop icons.
  const z = (sel: string) => page.locator(sel).evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(await z('.made-by')).toBeLessThan(await z('#window'));
  // The phone Home Screen versions (pill, widget, page dots) stay hidden on computers.
  await expect(page.locator('.home-pill')).toBeHidden();
  await expect(page.locator('.sw-widget')).toBeHidden();
  await expect(page.locator('.home-dots')).toBeHidden();

  // Closed until clicked; then "Made by" and the links show above the pill.
  const panel = footer.locator('.home-pill-panel');
  await expect(panel).toBeHidden();
  await expect(pill).toHaveAttribute('aria-expanded', 'false');
  await pill.click();
  await expect(pill).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  expect((await panel.boundingBox())!.y).toBeLessThan(b.y);
  await expect(panel).toContainText('Made by Shubham Chaudhary');
  const links = panel.getByRole('link');
  await expect(links).toHaveText(['CloudPrep ↗', 'Frontend Interview Prep ↗']);
  await expect(links.nth(0)).toHaveAttribute('href', 'https://aws-cloud-prepare.vercel.app');
  await expect(links.nth(1)).toHaveAttribute('href', 'https://frontend-interview-prepare.vercel.app');
  await expect(links.nth(1)).toHaveAttribute('rel', 'noopener noreferrer');

  // Escape closes it, and so does a click anywhere else.
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await pill.click();
  await expect(panel).toBeVisible();
  await page.mouse.click(700, 300);
  await expect(panel).toBeHidden();
});

test('the Contact tab fits a short laptop screen without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 680 });
  await openDesktop(page);
  await page.getByRole('tab', { name: 'Contact' }).click();
  // Send, Email and Download Resume share one row under the form.
  const row = page.locator('#contact-form .links-row');
  await expect(row.getByRole('button', { name: 'Send' })).toBeVisible();
  await expect(row.getByRole('link', { name: 'Email' })).toBeVisible();
  await expect(row.getByRole('button', { name: /Download Resume/ })).toBeVisible();
  // Send on the left, the others pushed to the right edge of the form, a divider between.
  await expect(row.locator('.form-actions-divider')).toBeVisible();
  const send = (await row.getByRole('button', { name: 'Send' }).boundingBox())!;
  const download = (await row.getByRole('button', { name: /Download Resume/ }).boundingBox())!;
  const form = (await page.locator('#message').boundingBox())!;
  expect(Math.abs(send.y - download.y)).toBeLessThan(2);
  expect(Math.abs(send.x - form.x)).toBeLessThan(2);
  expect(Math.abs(download.x + download.width - (form.x + form.width))).toBeLessThan(2);
  const overflow = await page.locator('#window .content').evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Contact shows the profile links beside the form, and below it in a narrow window', async ({ page }) => {
  await openDesktop(page);
  await page.getByRole('tab', { name: 'Contact' }).click();
  const card = page.getByRole('list', { name: 'Find me online' });
  const links = card.getByRole('link');
  await expect(links.locator('.profile-link-label')).toHaveText(['GitHub', 'LinkedIn', 'dev.to', 'Hashnode', 'Instagram']);
  await expect(links.nth(0)).toHaveAttribute('href', 'https://github.com/chaudharyShub');
  await expect(links.nth(0)).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(links.nth(2)).toHaveAttribute('href', 'https://dev.to/shubham_works');
  await expect(links.nth(3)).toHaveAttribute('href', 'https://hashnode.com/@shubhamworks');
  // Only actions stay in the button row.
  await expect(page.locator('#section-contact .links-row').getByRole('link', { name: 'GitHub' })).toHaveCount(0);
  // The Links Home Screen icon is for phones only.
  await expect(page.locator('#icon-links')).toBeHidden();

  // Wide window: to the right of the form, without scrolling.
  const form = page.locator('#contact-form');
  let formBox = (await form.boundingBox())!;
  let cardBox = (await card.boundingBox())!;
  expect(cardBox.x).toBeGreaterThan(formBox.x + formBox.width);
  expect(cardBox.y).toBeLessThan(formBox.y + 60);

  // Narrow window: stacked under the form.
  await page.locator('#window').evaluate((el) => el.style.setProperty('width', '620px', 'important'));
  await expect.poll(async () => (await card.boundingBox())!.y).toBeGreaterThan(formBox.y + formBox.height);
  formBox = (await form.boundingBox())!;
  cardBox = (await card.boundingBox())!;
  expect(Math.abs(cardBox.x - formBox.x)).toBeLessThan(2);
});

test('the logo menu keeps the profile links in a Links submenu', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#logo-menu-button').click();
  const linksItem = page.getByRole('menuitem', { name: /^Links/ });
  const submenu = page.getByRole('menu', { name: 'Links' });
  // Not listed up front.
  await expect(page.locator('#logo-menu').getByRole('menuitem', { name: /GitHub/ })).toHaveCount(0);
  // No section shortcuts: the menu bar and the sidebar have them.
  await expect(page.getByRole('menuitem', { name: 'Experience' })).toHaveCount(0);
  await expect(submenu).toBeHidden();

  // Pointing at "Links" opens the submenu beside the menu.
  await linksItem.hover();
  await expect(submenu).toBeVisible();
  await expect(linksItem).toHaveAttribute('aria-expanded', 'true');
  await expect(submenu.getByRole('menuitem')).toHaveText(['GitHub ↗', 'LinkedIn ↗', 'dev.to ↗', 'Hashnode ↗', 'Instagram ↗']);
  const menuBox = (await page.locator('#logo-menu').boundingBox())!;
  const subBox = (await submenu.boundingBox())!;
  expect(subBox.x).toBeGreaterThan(menuBox.x + menuBox.width - 10);
  await expect(submenu.getByRole('menuitem', { name: /dev\.to/ })).toHaveAttribute('href', 'https://dev.to/shubham_works');

  // Pointing at another item closes it.
  await page.getByRole('menuitem', { name: 'Download Resume' }).hover();
  await expect(submenu).toBeHidden();

  // Keyboard: Right arrow opens and focuses the first link, Down moves, Left goes back.
  await linksItem.focus();
  await page.keyboard.press('ArrowRight');
  await expect(submenu.getByRole('menuitem', { name: /GitHub/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(submenu.getByRole('menuitem', { name: /LinkedIn/ })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(submenu).toBeHidden();
  await expect(linksItem).toBeFocused();

  // Escape closes the whole menu.
  await page.keyboard.press('Escape');
  await expect(page.locator('#logo-menu')).toBeHidden();
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

  await input.fill('projects');
  await input.press('Enter');
  await expect(output).toContainText('2. CloudPrep');

  await input.fill('links');
  await input.press('Enter');
  await expect(output).toContainText('https://github.com/chaudharyShub');
  await expect(output).toContainText('https://hashnode.com/@shubhamworks');

  // help lists resume and points to the hidden commands; hint gives one clue at a time.
  await input.fill('help');
  await input.press('Enter');
  await expect(output).toContainText('resume, links');
  await expect(output).toContainText("3 commands are hidden. Type 'hint' for a clue.");
  await input.fill('hint');
  await input.press('Enter');
  await expect(output).toContainText('Clue 1 of 3:');
  await input.fill('hint');
  await input.press('Enter');
  await expect(output).toContainText('Clue 2 of 3:');

  await input.fill('echo');
  await input.press('Enter');
  await expect(output).not.toContainText('command not found: echo');

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
  const dockIcon = page.locator('#dock-portfolio');
  await win.getByRole('button', { name: 'Minimize', exact: true }).click();
  await expect(win).toBeHidden();
  // The Dock hears about it when the window lands.
  await expect(dockIcon).toHaveAttribute('aria-pressed', 'false');
  // The Dock magnifies under the pointer, so don't wait for the icon to hold still.
  await dockIcon.click({ force: true });
  await expect(win).toBeVisible();
  await expect(dockIcon).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
  // The genie animation plays on temporary copies; none may be left behind.
  await expect(page.locator('.genie-layer')).toHaveCount(0);
  await expect(win).toHaveCSS('visibility', 'visible');
  await expect(win).toHaveCSS('opacity', '1');
});

test('restoring from copies prepared on hover brings the window back as it was', async ({ page }) => {
  await openDesktop(page);
  const win = page.locator('#window');
  const content = win.locator('.content');
  await content.evaluate((el) => (el.scrollTop = 600));
  await win.getByRole('button', { name: 'Minimize', exact: true }).click();
  await expect(win).toBeHidden();
  await expect(page.locator('.genie-layer')).toHaveCount(0);
  // Resting the mouse on the Dock icon prepares the genie's copies; the window then stays
  // hidden until the genie lands.
  const dockIcon = page.locator('#dock-portfolio');
  await dockIcon.hover({ force: true });
  await expect(page.locator('.genie-layer')).toHaveCount(1);
  await dockIcon.click({ force: true });
  await expect(win).toBeVisible();
  await expect(page.locator('.genie-layer')).toHaveCount(0);
  await expect(win).toHaveCSS('visibility', 'visible');
  await expect(dockIcon).toHaveAttribute('aria-pressed', 'true');
  expect(await content.evaluate((el) => el.scrollTop)).toBe(600);
});

/** The Dock is drawn above whatever covers the screen (full-screen windows and panels). */
async function expectDockOnTop(page: Page) {
  const box = (await page.locator('#dock-portfolio').boundingBox())!;
  const onTop = await page.evaluate(
    ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.dock'),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  expect(onTop).toBe(true);
}

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
  // Full screen: it covers the menu bar too, the Dock floats on top, and the status bar sits
  // above the Dock.
  await expect.poll(async () => (await win.boundingBox())?.height).toBe(page.viewportSize()?.height);
  expect((await win.boundingBox())!.y).toBe(0);
  await expectDockOnTop(page);
  const dockTop = (await page.locator('.dock').boundingBox())!.y;
  const chipBox = (await win.locator('.status-bar .visitor-counter').boundingBox())!;
  expect(chipBox.y + chipBox.height).toBeLessThanOrEqual(dockTop);
  await win.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(win).not.toHaveClass(/maximized/);
  await expect.poll(async () => await win.boundingBox()).toEqual(before);
  // The GPU layers used while it glides are dropped afterwards.
  await expect(win).not.toHaveClass(/window--gliding/);
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

test('Time Machine opens from the Dock and travels from today back to birth', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-timemachine').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Time Machine' });
  await expect(dialog).toBeVisible();
  const ticks = dialog.getByRole('tab');
  const panel = dialog.locator('.tm-snapshot[aria-hidden="false"]');
  // Birth, idle years, two schools, college, three jobs and the MBA on its side lane.
  await expect(ticks).toHaveCount(9);
  const last = (await ticks.count()) - 1;
  // Starts at the latest job.
  await expect(ticks.nth(last)).toHaveAttribute('aria-selected', 'true');
  await expect(dialog.getByRole('heading', { name: 'Frontend Developer' })).toBeVisible();

  // One step back is the MBA, which runs alongside the job on the side lane.
  await dialog.getByRole('button', { name: 'Back in time' }).click();
  await expect(ticks.nth(last - 1)).toHaveAttribute('aria-selected', 'true');
  await expect(ticks.nth(last - 1)).toHaveClass(/tm-tick--side/);
  await expect(panel).toContainText('Amity University Online');
  await expect(panel.locator('.tm-link')).toHaveAttribute('href', 'https://amityonline.com');
  await expect(panel).toContainText('July 2025 - July 2027');
  await dialog.getByRole('button', { name: 'Back in time' }).click();
  await expect(panel).toContainText('Quokka Labs');

  // Arrow keys move along the timeline and keep focus on the selected year.
  await ticks.nth(last - 2).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(panel).toContainText('Riviera Home Furnishings');
  await page.keyboard.press('ArrowLeft');
  await expect(panel).toContainText('Vidya College of Engineering');
  await expect(ticks.nth(4)).toBeFocused();

  // The very first stop is birth, in 1995.
  await ticks.first().click();
  await expect(ticks.first()).toHaveAttribute('aria-selected', 'true');
  await expect(panel).toContainText('System first booted');
  await expect(dialog.locator('.tm-year-display')).toHaveText('1995');

  // Going back past birth: no trip, just a note.
  await dialog.getByRole('button', { name: 'Back in time' }).click();
  await expect(dialog.getByRole('status')).toHaveText('No data before 1995. Try asking my parents.');
  await expect(ticks.first()).toHaveAttribute('aria-selected', 'true');

  // Scrolling down over the snapshots travels forward in time again.
  await dialog.locator('.tm-stack').hover();
  // Scrolling is ignored while the last trip is still traveling (TRAVEL_MS = 700).
  await page.waitForTimeout(750);
  await page.mouse.wheel(0, 120);
  await expect(ticks.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(panel).toContainText('3 years of doing nothing');
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
  await expectDockOnTop(page);

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

test('the status bar stays on one row at any window width, with Larger Text too', async ({ page }) => {
  await openDesktop(page);
  const bar = page.locator('#window .status-bar');
  for (const width of [1440, 1200, 1000, 800]) {
    await page.setViewportSize({ width, height: 800 });
    for (const larger of [false, true]) {
      await page.evaluate((on) => document.documentElement.toggleAttribute('data-larger-text', on), larger);
      const rows = await bar.evaluate((el) => {
        const tops = [...el.children]
          .map((child) => child.getBoundingClientRect())
          .filter((r) => r.width > 0)
          .map((r) => Math.round(r.top + r.height / 2));
        return new Set(tops.map((t) => Math.round(t / 4))).size;
      });
      expect(rows, `${width}px, larger text ${larger}`).toBe(1);
      // The like and visitor chips always stay.
      await expect(bar.locator('.visitor-counter')).toBeVisible();
    }
  }
});

test('the Time Machine never needs a scrollbar, even on a short laptop screen', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 657 });
  await openDesktop(page);
  await page.locator('#dock-timemachine').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Time Machine' });
  await expect(dialog).toBeVisible();
  const fits = () =>
    page.locator('.time-machine-box').evaluate((el) => el.scrollHeight <= el.clientHeight);
  await expect.poll(fits).toBe(true);
  await expect(dialog.locator('.tm-hint')).toBeVisible();
  await dialog.getByRole('button', { name: 'Enter Full Screen' }).click();
  await expect.poll(fits).toBe(true);
});

test('Debug Runner: the top score of all players shows, and a run sends its score with its ticket', async ({
  page,
}) => {
  // A low top score, so the first crash beats it.
  const state = await stubTopScore(page, { start: 1 });
  await openDesktop(page);
  await page.locator('#dock-game').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Debug Runner' });
  await expect(dialog.locator('.game-top')).toHaveText(/Top score: 1$/);

  const over = dialog.locator('#game-over-msg');
  await expect(over).toBeVisible({ timeout: 10_000 });
  await expect(over.locator('.game-record')).toHaveText('New top score for all players!');
  expect(state.tickets).toBe(1);
  expect(state.submits).toHaveLength(1);
  expect(state.submits[0]?.ticket).toBe('test-ticket-1');
  const sent = state.submits[0]?.score ?? 0;
  expect(sent).toBeGreaterThan(1);
  await expect(over.locator('.game-over-sub')).toContainText(`Top score: ${sent.toLocaleString('en-US')}`);
  await expect(dialog.locator('.game-top')).toContainText(sent.toLocaleString('en-US'));

  // The next run gets a fresh ticket and the record message goes away.
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  await expect(over).toBeHidden();
  expect(state.tickets).toBe(2);
});

test('Debug Runner: the top score hides when the server has none, and other sites cannot send scores', async ({
  page,
  request,
}) => {
  // Tests point the database at a dead address, so the real route answers 503.
  await openDesktop(page);
  await page.locator('#dock-game').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Debug Runner' });
  await expect(dialog.locator('.game-score-line')).toContainText('Your best');
  await expect(dialog.locator('.game-top')).toHaveCount(0);
  expect((await request.get('/api/debug-runner')).status()).toBe(503);
  const foreign = await request.post('/api/debug-runner', {
    headers: { Origin: 'https://example.com' },
    data: { ticket: 'x', score: 99999 },
  });
  expect(foreign.status()).toBe(403);
  const foreignRun = await request.post('/api/debug-runner/run', { headers: { Origin: 'https://example.com' } });
  expect(foreignRun.status()).toBe(403);
});

test('Debug Runner: the score climbs, a crash shows a joke and saves the best score', async ({ page }) => {
  await openDesktop(page);
  await page.locator('#dock-game').click({ force: true });
  const dialog = page.getByRole('dialog', { name: 'Debug Runner' });
  await expect(dialog).toBeVisible();
  const scoreLine = dialog.locator('.game-score-line span').first();
  // Points come in per second, whatever the screen's refresh rate.
  await expect.poll(async () => Number(await scoreLine.textContent()), { timeout: 5_000 }).toBeGreaterThan(5);

  // Nobody jumps, so the first bug ends the run with one of the game-over lines.
  const over = dialog.locator('#game-over-msg');
  await expect(over).toBeVisible({ timeout: 10_000 });
  const line = await over.locator('.game-over-title').textContent();
  expect(GAME_OVER_LINES).toContain(line);
  const best = Number(await page.evaluate(() => localStorage.getItem('debugRunnerBest')));
  expect(best).toBeGreaterThan(0);

  // Space starts a new run, once the 400ms after a crash have passed (RESTART_DELAY_MS in
  // DebugRunnerDialog.tsx ignores a key still held from jumping; pressing sooner was flaky).
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  await expect(over).toBeHidden();
  await dialog.locator('.dialog-buttons').getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});
