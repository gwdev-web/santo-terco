import { expect, PAGES, serveLocalData, test, waitForData } from './fixtures.js';

test.use({ serviceWorkers: 'allow' });

/** First visit online: waits until the service worker has cached the site and controls the page. */
async function installApp(page, context) {
  await serveLocalData(context); // also answers the requests the service worker makes
  await page.goto('index.html');
  await waitForData(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

test('the site works offline after the first visit', async ({ page, context }) => {
  await installApp(page, context);
  await context.setOffline(true);
  // Anything missing from the cache (a font, an illustration, a script) fails without the network
  const failed = [];
  page.on('requestfailed', (request) => failed.push(request.url()));

  for (const path of PAGES) {
    await page.goto(path);
    const main = page.locator('main');
    if (await main.getAttribute('aria-busy')) await waitForData(page);
    await expect(page.locator('h1:visible'), path).toHaveCount(1);
    await expect(page.getByRole('alert').filter({ hasText: 'Tentar de novo' }), path).toHaveCount(0);
  }
  expect(failed).toEqual([]);
});

test('a terço never opened before can be prayed offline', async ({ page, context }) => {
  await installApp(page, context);
  await context.setOffline(true);

  await page.goto('pray.html?mystery=luminous&step=3');
  await waitForData(page);
  await expect(page.getByText('3º Mistério Luminoso')).toBeVisible();

  const illustration = page.locator('[data-meditation-illustration]');
  await expect(illustration).toBeVisible();
  const toggle = page.getByRole('button', { name: /^Rezei ?: Pai Nosso/ }).first();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('repeat visits load pages, assets and data from the device', async ({ page, context, browserName }) => {
  // Safari also reuses files kept in memory from the previous page, which look like network responses here
  test.skip(browserName === 'webkit', 'Chromium tells the service worker apart from the network');
  await installApp(page, context);

  const fromNetwork = [];
  page.on('response', (response) => {
    if (!response.fromServiceWorker()) fromNetwork.push(response.url());
  });
  await page.goto('pray.html');
  await waitForData(page);

  expect(fromNetwork).toEqual([]);
});

test('an unknown page offline shows the "not found" page', async ({ page, context }) => {
  await installApp(page, context);
  await context.setOffline(true);

  await page.goto('does-not-exist.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página não existe');
});
