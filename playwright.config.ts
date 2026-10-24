import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;

/**
 * Browser tests (`npm run test:e2e`). They run against a production build made in its own folder
 * (`.next-e2e`) with a fake Web3Forms key, and every contact test stubs api.web3forms.com, so no
 * real message can ever be sent.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // The production service worker could answer requests before the Web3Forms stub sees them.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    {
      name: 'phone',
      use: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      // Takes precedence over .env.local, so the test build never holds the real key.
      WEB3FORMS_ACCESS_KEY: 'test-key-not-real',
    },
  },
});
