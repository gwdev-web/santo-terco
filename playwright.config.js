import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Browser tests (npm run test:e2e) on the production build, served as on GitHub Pages
 * under /santo-terco/. The data requests to GitHub raw are answered with this repository's
 * /data files (see tests/e2e/fixtures.js), so the tests check the code and data being changed.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/santo-terco/`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // The motion is checked by hand; here it would only slow the tests and the "next step" pulse never settles
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/santo-terco/`,
    reuseExistingServer: !process.env.CI,
  },
});
