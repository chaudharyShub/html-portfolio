import { expect, test, type Page } from '@playwright/test';
import { openDesktop, stubLikes } from './helpers';

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
  // Five tabs fit on one row. (With the Writing section, turned off for now, Writing is a
  // computer-sidebar tab and on phones the posts are on Home.)
  const tabs = page.locator('#window [role="tab"]').filter({ visible: true });
  await expect(tabs).toHaveCount(5);
  // await expect(page.locator('#tab-writing')).toBeHidden();
  // await expect(page.locator('#section-writing')).toBeAttached();
  // await page.locator('#section-writing').scrollIntoViewIfNeeded();
  // await expect(page.locator('#section-writing')).toBeVisible();
  const last = await box(page, '#tab-contact');
  expect(last.x + last.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  expect(last.y).toBeGreaterThanOrEqual(bar.y);
  await page.getByRole('tab', { name: 'Skills' }).tap();
  await expect(page.getByRole('heading', { name: 'Skills', exact: true })).toBeVisible();
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

test('the like button sits at the right of the title bar, not in the footer', async ({ page }) => {
  const state = await stubLikes(page);
  await openDesktop(page);
  const heart = page.locator('#window .title-bar .like-button');
  await expect(heart).toContainText('41');
  await expect(page.locator('#window .status-bar .like-button')).toBeHidden();

  const bar = await box(page, '#window .title-bar');
  const b = await box(page, '#window .title-bar .like-button');
  expect(b.x + b.width).toBeGreaterThan(bar.x + bar.width - 20);
  await noHorizontalScroll(page);

  // Tapping it likes; it doesn't count as tapping the title bar (which scrolls to the top).
  const app = page.locator('#window');
  await app.evaluate((el) => el.scrollTo({ top: 400 }));
  await heart.tap();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect(heart).toContainText('42');
  expect(await app.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(state.posts).toBe(1);
});

test('a notification can be pushed up to dismiss it; a short push springs back', async ({ page }) => {
  await stubLikes(page);
  // On a busy machine the test can outlast the banner's 4.5s auto-hide, and it left mid-push.
  // Stretch only that timer (Toast.tsx's TOAST_DURATION_MS); pausing the whole clock froze animations.
  await page.addInitScript(() => {
    const realSetTimeout = window.setTimeout;
    window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) =>
      realSetTimeout(fn, ms === 4500 ? 600_000 : ms, ...args)) as typeof window.setTimeout;
  });
  await openDesktop(page);
  await page.locator('#window .title-bar .like-button').tap();
  const toast = page.locator('.toast-inner');
  await expect(toast).toContainText('Thanks for the like');
  const restY = 8; // its resting place: 8px from the top of the screen
  // The browser applies pointer moves once per frame, so wait for the banner to catch up with
  // the finger before checking or letting go (reading right away saw only the first few px).
  const toastTop = async () => (await toast.boundingBox())!.y;
  // Press only once it has slid in: a press where it will land, while it is still above, hits the
  // empty container instead and grabs nothing.
  await expect.poll(async () => Math.round(await toastTop())).toBe(restY);
  const box = (await toast.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = restY + box.height / 2;
  // Finger-speed steps: moves sent all at once read as a quick flick, which dismisses it.
  const push = async (distance: number, steps: number) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(x, y - (distance * i) / steps);
      await page.waitForTimeout(30);
    }
  };

  // A short push: it follows the finger, then springs back.
  await push(15, 5);
  await expect.poll(toastTop).toBeLessThan(restY - 10);
  await page.mouse.up();
  await expect.poll(async () => Math.round(await toastTop())).toBe(restY);

  // A longer push dismisses it.
  await push(80, 8);
  await expect.poll(toastTop).toBeLessThan(restY - 60);
  await page.mouse.up();
  await expect(toast).toHaveCount(0);
});

test('the tab bar fills the selected tab icon and outlines the others', async ({ page }) => {
  await openDesktop(page);
  const shows = (id: string, part: 'line' | 'fill') => page.locator(`#tab-${id} .tab-glyph-${part}`);
  await page.locator('#tab-projects').tap();
  await expect(shows('projects', 'fill')).toBeVisible();
  await expect(shows('projects', 'line')).toBeHidden();
  await expect(shows('home', 'line')).toBeVisible();
  await expect(shows('home', 'fill')).toBeHidden();
});

test('a single tap opens a Home Screen icon', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#icon-mycomputer').tap();
  await expect(page.getByRole('dialog', { name: 'About This Developer' })).toBeVisible();
});

test('Activity Monitor opens from the Home Screen and fits the phone', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#icon-activity').tap();
  const dialog = page.getByRole('dialog', { name: 'Activity Monitor' });
  await expect(dialog).toBeVisible();
  // Rows stay rows on phones (the portfolio's stacked-table style must not apply here).
  await expect(dialog.locator('.am-table td').first()).toHaveCSS('display', 'table-cell');
  await dialog.locator('.am-name', { hasText: 'Node.js' }).tap();
  await expect(dialog.locator('.am-used')).toContainText('Quokka Labs');
  await noHorizontalScroll(page);
});

test('the More button opens an action sheet with Cancel on screen', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator('#dock-more').tap();
  const cancel = page.getByRole('menuitem', { name: 'Cancel' });
  await expect(cancel).toBeVisible();
  // Profile links are in the Home Screen's Links sheet instead; Download Resume stays.
  await expect(page.getByRole('menuitem', { name: /^Links/ })).toBeHidden();
  await expect(page.getByRole('menuitem', { name: 'Download Resume' })).toBeVisible();
  // No section shortcuts: the app's tab bar has them.
  await expect(page.getByRole('menuitem', { name: 'Experience' })).toHaveCount(0);
  await page.waitForTimeout(600); // let the sheet finish sliding up
  const c = (await cancel.boundingBox())!;
  expect(c.y + c.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await cancel.tap();
  // It slides back down (still on screen for a moment), then hides.
  await expect(page.locator('#logo-menu')).toHaveClass(/closing/);
  await expect(page.locator('#logo-menu')).toBeHidden();
  await expect(page.locator('#logo-menu')).not.toHaveClass(/closing/);
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

// Time Machine and Activity Monitor are taller than the screen allows (capped, content scrolls);
// they once grew to full content height on the first touch and jumped past the top of the screen.
for (const [name, opener] of [
  ['System Settings', '#dock-settings'],
  ['Time Machine', '#icon-timemachine'],
  ['Activity Monitor', '#icon-activity'],
] as const) test(`the ${name} sheet is pulled down by its top: springs back from a short pull, closes from a long one`, async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await page.locator(opener).tap();
  const sheet = page.getByRole('dialog', { name });
  await expect(sheet).toBeVisible();
  // Scrolling sheets must not rubber-band (iOS showed an empty gap above the pulled-down content).
  await expect(sheet).toHaveCSS('overscroll-behavior-y', 'none');
  await page.waitForTimeout(600);
  const b = (await sheet.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + 20; // the title bar, by the grabber

  // Real touch events (Chromium), moved in small steps like a finger.
  const cdp = await page.context().newCDPSession(page);
  const pull = async (distance: number, fromY = y) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: fromY + (distance * i) / 10 }] });
      await page.waitForTimeout(30);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  // Pulled up, the sheet stretches taller; its bottom stays on the screen's edge (no gap), then it settles back.
  const viewportHeight = page.viewportSize()!.height;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 12 * i }] });
    await page.waitForTimeout(30);
  }
  const stretched = (await sheet.boundingBox())!;
  expect(stretched.y).toBeLessThan(b.y - 10);
  expect(Math.round(stretched.y + stretched.height)).toBe(viewportHeight);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const settled = (await sheet.boundingBox())!;
  expect(Math.round(settled.y)).toBe(Math.round(b.y));
  expect(Math.round(settled.height)).toBe(Math.round(b.height));

  // Pulled down a bit, it slides down whole: same height, top under the finger (no gap above it).
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 6 * i }] });
    await page.waitForTimeout(30);
  }
  const lowered = (await sheet.boundingBox())!;
  expect(Math.round(lowered.height)).toBe(Math.round(b.height));
  expect(Math.abs(lowered.y - (b.y + 60))).toBeLessThan(3);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  await expect(sheet).toBeVisible();
  expect(Math.round((await sheet.boundingBox())!.y)).toBe(Math.round(b.y));

  // Only the top (title bar + grabber) drags it: a long pull on the content leaves it open.
  await pull(b.height / 2, b.y + 140);
  await page.waitForTimeout(500);
  await expect(sheet).toBeVisible();
  expect(Math.round((await sheet.boundingBox())!.y)).toBe(Math.round(b.y));

  await pull(b.height / 2);
  await expect(sheet).toBeHidden();
});

test('the Links icon sits before Trash and opens every profile link in a sheet', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  const linksIcon = await box(page, '#icon-links');
  const trash = await box(page, '#icon-trash');
  expect(linksIcon.x).toBeLessThan(trash.x);
  expect(Math.abs(linksIcon.y - trash.y)).toBeLessThan(2);

  await page.locator('#icon-links').tap();
  const list = page.getByRole('list', { name: 'Profile links' });
  await expect(list).toBeVisible();
  await expect(list.locator('.profile-link-label')).toHaveText(['GitHub', 'LinkedIn', 'dev.to', 'Hashnode', 'Instagram']);
  await expect(list.getByRole('link').nth(1)).toHaveAttribute('href', /linkedin\.com/);
  // The sheet's "Done" button.
  await page.getByRole('dialog', { name: 'Find me online' }).getByRole('button', { name: 'Close' }).tap();
  await expect(list).toBeHidden();
});

test('the Home Screen has two pages: icons first, then the Shubham Works widget', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  // The desktop pill gives way to the phone version.
  await expect(page.locator('.made-by')).toBeHidden();

  // Page 1: the Shubham Works pill is commented out in DesktopIcons.tsx for now (user's choice, Nov 2026).
  // To bring it back, uncomment it there and restore this check from git history (commit 9ff8ce5).
  await expect(page.getByRole('button', { name: 'A Shubham Works project' })).toHaveCount(0);

  // Page 2, through its page dot: the widget with every link.
  const widget = page.locator('.sw-widget');
  await expect(widget).not.toBeInViewport();
  await page.getByRole('button', { name: 'Home Screen page 2 of 2' }).tap();
  await expect(widget).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Home Screen page 2 of 2' })).toHaveAttribute('aria-current', 'true');
  await expect(widget.getByRole('link', { name: /Frontend Interview Prep/ })).toHaveAttribute(
    'href',
    'https://frontend-interview-prepare.vercel.app',
  );
  await expect(page.locator('#icon-trash')).not.toBeInViewport();
  await noHorizontalScroll(page);

  // And back to page 1.
  await page.getByRole('button', { name: 'Home Screen page 1 of 2' }).tap();
  await expect(page.locator('#icon-trash')).toBeInViewport();
});

test('the Home Screen has a sticky note widget and the Time Machine app', async ({ page }) => {
  await openDesktop(page);
  await goHome(page);
  await expect(page.locator('.sticky-note')).toBeVisible();
  await page.locator('#icon-timemachine').tap();
  await expect(page.getByRole('dialog', { name: 'Time Machine' })).toBeVisible();
  await noHorizontalScroll(page);

  // Scrolled, the year slides under the sticky title bar, not over it.
  await page.waitForTimeout(600);
  const onTop = await page.evaluate(() => {
    const box = document.querySelector<HTMLElement>('.time-machine-box')!;
    const bar = box.querySelector<HTMLElement>('.dialog-title-bar')!;
    const year = box.querySelector<HTMLElement>('.tm-year-display')!;
    box.scrollTop += year.getBoundingClientRect().top - bar.getBoundingClientRect().top;
    const r = year.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return bar.contains(hit);
  });
  expect(onTop).toBe(true);
});
