import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;

/**
 * Browser tests (`npm run test:e2e`). They run against a production build made in its own folder
 * (`.next-e2e`) with a fake Web3Forms key, and every contact test stubs api.web3forms.com, so no
 * real message can ever be sent. The likes database is swapped for a dead address the same way.
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
      // A dead address instead of the real likes database from .env.local: tests stub /api/likes,
      // and anything they don't stub fails fast instead of changing the real count.
      KV_REST_API_URL: 'http://127.0.0.1:9',
      KV_REST_API_TOKEN: 'test-token-not-real',
      // Fake ownership codes, so the SEO test can see the verification tags.
      GOOGLE_SITE_VERIFICATION: 'test-google-code',
      BING_SITE_VERIFICATION: 'test-bing-code',
    },
  },
});
