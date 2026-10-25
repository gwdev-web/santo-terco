import { DATA_URL, expect, serveLocalData, test, waitForData } from './fixtures.js';

test.describe('when the data does not load', () => {
  test.use({ expectedConsole: /Could not load the data|Failed to load resource/ });

  test('shows the error and loads again with "Tentar de novo"', async ({ page }) => {
    await page.unrouteAll();
    await page.route(`${DATA_URL}*.json`, (route) => route.abort('internetdisconnected'));

    await page.goto('pray.html');
    await waitForData(page);
    const error = page.getByRole('alert').filter({ hasText: 'Tentar de novo' });
    await expect(error).toBeVisible();

    await page.unrouteAll();
    await serveLocalData(page);
    await error.getByRole('button', { name: 'Tentar de novo' }).click();

    await expect(error).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orações iniciais');
  });
});

test.describe('when the browser does not keep the site data', () => {
  test.use({ expectedConsole: /localStorage is unavailable|Could not save "santo-terco:/ });

  test('tells the user and still lets them pray', async ({ page }) => {
    // As in a private window with site data blocked: every access throws
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      });
    });

    await page.goto('pray.html');
    await waitForData(page);
    await expect(page.getByText('Este navegador não está guardando o seu progresso.')).toBeVisible();

    const toggle = page.getByRole('button', { name: /^Rezei ?: Sinal da Cruz/ }).first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('with an unknown mystery in the URL', () => {
  test.use({ expectedConsole: /Unknown mystery "abc"/ });

  test("shows today's mysteries", async ({ page }) => {
    await page.goto('pray.html?mystery=abc');
    await waitForData(page);
    await expect(page.locator('[data-set-name]')).toHaveText('Mistérios Gloriosos');
  });
});
