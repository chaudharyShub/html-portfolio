import { expect, test, type Page } from '@playwright/test';
import { openDesktop, stubWeb3Forms } from './helpers';

async function openContact(page: Page) {
  await openDesktop(page);
  await page.getByRole('tab', { name: 'Contact' }).click();
}

async function fillForm(page: Page, message = 'Hello from the tests') {
  await page.getByLabel('Name:').fill('Test Visitor');
  await page.getByLabel('Email:').fill('visitor@example.com');
  await page.getByLabel('Message:').fill(message);
}

const toast = (page: Page) => page.locator('#toast');

test('sends a message and clears the form', async ({ page }) => {
  const sent = await stubWeb3Forms(page);
  await openContact(page);
  await fillForm(page);
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(toast(page)).toContainText('Message sent');
  expect(sent.count).toBe(1);
  await expect(page.getByLabel('Message:')).toHaveValue('');
});

test('many submits fired at the same instant send only once', async ({ page }) => {
  const sent = await stubWeb3Forms(page, { delayMs: 400 });
  await openContact(page);
  await fillForm(page);
  await page.evaluate(() => {
    const form = document.getElementById('contact-form') as HTMLFormElement;
    for (let i = 0; i < 20; i++) form.requestSubmit();
  });

  await expect(toast(page)).toContainText('Message sent');
  expect(sent.count).toBe(1);
});

test('allows 5 messages a minute, then asks the visitor to wait, even after a reload', async ({ page }) => {
  const sent = await stubWeb3Forms(page, { delayMs: 20 });
  await openContact(page);
  const send = page.getByRole('button', { name: 'Send', exact: true });

  for (let i = 1; i <= 5; i++) {
    await fillForm(page, `Message ${i}`);
    await send.click();
    await expect(page.getByLabel('Message:')).toHaveValue('');
  }
  expect(sent.count).toBe(5);

  await fillForm(page, 'Message 6');
  await send.click();
  await expect(toast(page)).toContainText(/You can send another in \d+ seconds/);
  expect(sent.count).toBe(5);
  // The typed text is kept so the visitor doesn't lose it.
  await expect(page.getByLabel('Message:')).toHaveValue('Message 6');

  await openContact(page);
  await fillForm(page, 'After reload');
  await send.click();
  await expect(toast(page)).toContainText(/You can send another in \d+ seconds/);
  expect(sent.count).toBe(5);
});

test('sends that are over a minute old no longer count', async ({ page }) => {
  const sent = await stubWeb3Forms(page);
  await page.addInitScript(() => {
    const old = Date.now() - 61_000;
    localStorage.setItem('shubhamOsContactSends', JSON.stringify([old, old, old, old, old]));
  });
  await openContact(page);
  await fillForm(page);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(toast(page)).toContainText('Message sent');
  expect(sent.count).toBe(1);
});

test('the honeypot drops bot submissions without sending', async ({ page }) => {
  const sent = await stubWeb3Forms(page);
  await openContact(page);
  await fillForm(page);
  // Hidden from people, so tick it the way a bot would: from a script.
  await page.locator('input[name="botcheck"]').evaluate((el: HTMLInputElement) => {
    el.checked = true;
  });
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(toast(page)).toContainText('Message sent');
  expect(sent.count).toBe(0);
});

test('falls back to the mail app when sending fails', async ({ page }) => {
  const sent = await stubWeb3Forms(page, { ok: false });
  await openContact(page);
  await fillForm(page);
  await page.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(toast(page)).toContainText("Message couldn't be sent");
  expect(sent.count).toBe(1);
  // A failed send doesn't use up one of the visitor's 5 messages.
  const saved = await page.evaluate(() => localStorage.getItem('shubhamOsContactSends'));
  expect(saved).toBeNull();
});
