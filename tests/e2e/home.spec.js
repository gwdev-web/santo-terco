import { expect, test, TODAY_KEY, waitForData } from './fixtures.js';

test('suggests the mysteries of the day and starts the terço', async ({ page }) => {
  await page.goto('index.html');
  await waitForData(page);

  // Sunday: the Glorious mysteries
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoje rezamos os Mistérios Gloriosos');
  await expect(page.locator('[aria-current="date"]')).toContainText('Gloriosos');

  await page.getByRole('link', { name: 'Começar o terço de hoje' }).click();
  await expect(page).toHaveURL(/pray\.html\?mystery=glorious/);
  await waitForData(page);
  await expect(page.locator('[data-set-name]')).toHaveText('Mistérios Gloriosos');
});

test('offers to continue a terço started today', async ({ page }) => {
  await page.goto('index.html');
  await page.evaluate(
    (date) =>
      localStorage.setItem('santo-terco:progress', JSON.stringify({ date, sets: { glorious: { 'opening/0': 1 } } })),
    TODAY_KEY,
  );
  await page.reload();
  await waitForData(page);

  await expect(page.getByRole('link', { name: 'Continuar o terço de hoje' })).toBeVisible();
});
