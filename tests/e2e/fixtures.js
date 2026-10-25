import { resolve } from 'node:path';
import { test as base, expect } from '@playwright/test';

/** Where the build reads the data from (BUILD_DATA_URL in vite.config.js). */
export const DATA_URL = 'https://raw.githubusercontent.com/gwdev-web/santo-terco/main/data/';

/** Sunday, 25 Oct 2026, in the morning: today's set is the Glorious mysteries. */
export const TODAY = new Date('2026-10-25T09:00:00-03:00');
export const TODAY_KEY = '2026-10-25';

export const PAGES = [
  'index.html',
  'mysteries.html',
  'prayers.html',
  'pray.html',
  'rosary-complete.html',
  'history.html',
  'about.html',
  'symbols.html',
  '404.html',
];

/** Answers the GitHub raw requests with the local /data files, as GitHub would (CORS allowed), on a page or a whole context. */
export const serveLocalData = (target) =>
  target.route(`${DATA_URL}*.json`, (route) =>
    route.fulfill({
      path: resolve(import.meta.dirname, '../../data', new URL(route.request().url()).pathname.split('/').pop()),
      contentType: 'application/json; charset=utf-8',
      headers: { 'access-control-allow-origin': '*' },
    }),
  );

/**
 * - Every page gets the local data and a fixed day.
 * - A normal visit logs nothing (CLAUDE.md, "Errors and the console"): any console error
 *   or warning fails the test, except the ones matching `test.use({ expectedConsole: /pattern/ })`.
 */
/** Logged by Playwright itself when it blocks the service worker (`serviceWorkers: 'block'`), not by the site. */
const PLAYWRIGHT_MESSAGE = /Service Worker registration blocked by Playwright/;

export const test = base.extend({
  expectedConsole: [null, { option: true }],

  page: async ({ page, expectedConsole }, use) => {
    const messages = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) messages.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => messages.push(`uncaught: ${error.message}`));

    await page.clock.setFixedTime(TODAY);
    await serveLocalData(page);
    await use(page);

    const unexpected = messages.filter((text) => !PLAYWRIGHT_MESSAGE.test(text) && !expectedConsole?.test(text));
    expect(unexpected, 'console errors and warnings').toEqual([]);
  },
});

/** Waits until the page's data is loaded and rendered (initDataLoader sets aria-busy back to false). */
export const waitForData = (page) => expect(page.locator('main')).toHaveAttribute('aria-busy', 'false');

export { expect };
