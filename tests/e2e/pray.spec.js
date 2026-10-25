import { expect, test, TODAY_KEY, waitForData } from './fixtures.js';

/** Marks every prayer of the stage on screen: the "Rezei" toggles and the last bead of each counter. */
async function prayStage(page) {
  const steps = page.locator('[data-steps] [data-step]');

  for (const step of await steps.all()) {
    const toggle = step.getByRole('button', { name: /^Rezei ?:/ });
    if (await toggle.count()) {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    } else {
      // Tapping a bead marks every bead up to it
      const lastBead = step.getByRole('button', { name: /^(\d+) de \1:/ });
      await lastBead.click();
      await expect(step.getByRole('button', { name: / de \d+:/, pressed: false })).toHaveCount(0);
    }
  }
}

const savedHistory = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('santo-terco:history') ?? '[]'));

test('prays a whole terço, stage by stage, and saves it in the history', async ({ page }) => {
  await page.goto('pray.html');
  await waitForData(page);
  const progress = page.locator('[data-progress-count]');
  await expect(progress).toHaveText('0 de 71 orações');

  // Opening prayers
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orações iniciais');
  await prayStage(page);
  await expect(progress).toHaveText('8 de 71 orações');
  await expect(page.getByText('Primeira medalha conquistada!').first()).toBeVisible();

  // The five mysteries
  for (let mystery = 1; mystery <= 5; mystery += 1) {
    await page.locator('[data-next-link]').click();
    await expect(page).toHaveURL(new RegExp(`step=${mystery}$`));
    await waitForData(page);
    await expect(page.getByText(`${mystery}º Mistério Glorioso`)).toBeVisible();
    await prayStage(page);
    await expect(progress).toHaveText(`${8 + 12 * mystery} de 71 orações`);
  }

  // Closing prayers
  await page.locator('[data-next-link]').click();
  await expect(page).toHaveURL(/step=closing$/);
  await waitForData(page);
  await prayStage(page);
  await expect(progress).toHaveText('71 de 71 orações');

  await page.getByRole('button', { name: 'Concluir o terço' }).click();
  await expect(page.locator('[data-celebration]')).toBeVisible();
  await expect(page.locator('[data-celebration-text]')).toHaveText('Você rezou os 5 Mistérios Gloriosos.');
  await expect(page.locator('[data-celebration-rosary-title]')).toHaveText('Rosário de hoje · 1 de 4');

  expect(await savedHistory(page)).toMatchObject([{ setId: 'glorious', date: TODAY_KEY }]);
  // The next terço of this set starts from the beginning
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('santo-terco:progress')).sets)).toEqual({});
});

test('keeps the marks after reloading and continues where the user stopped', async ({ page }) => {
  await page.goto('pray.html?mystery=joyful');
  await waitForData(page);
  await prayStage(page);

  await page.goto('pray.html?mystery=joyful');
  await waitForData(page);
  // The opening is done, so the terço continues at the 1st mystery
  await expect(page.getByText('1º Mistério Gozoso')).toBeVisible();
  await expect(page.locator('[data-progress-count]')).toHaveText('8 de 71 orações');

  await page.goto('pray.html?mystery=joyful&step=opening');
  await waitForData(page);
  await expect(page.getByRole('button', { name: /^Rezei ?: Sinal da Cruz/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a bead can be unmarked by tapping it again', async ({ page }) => {
  await page.goto('pray.html?mystery=glorious&step=1');
  await waitForData(page);

  const third = page.getByRole('button', { name: /^3 de 10:/ });
  await third.click();
  await expect(page.getByRole('button', { name: /de 10:/, pressed: true })).toHaveCount(3);
  await third.click();
  await expect(page.getByRole('button', { name: /de 10:/, pressed: true })).toHaveCount(2);
});

test('the fourth terço of the day completes the Rosary', async ({ page }) => {
  await page.goto('index.html');
  await page.evaluate(
    (date) =>
      localStorage.setItem(
        'santo-terco:history',
        JSON.stringify(
          ['joyful', 'sorrowful', 'luminous'].map((setId) => ({ setId, date, completedAt: `${date}T08:00:00.000Z` })),
        ),
      ),
    TODAY_KEY,
  );

  await page.goto('pray.html?mystery=glorious&step=closing');
  await waitForData(page);
  // Marking is optional: the terço can be concluded at any moment
  await page.getByRole('button', { name: 'Concluir o terço' }).click();

  await expect(page).toHaveURL(/rosary-complete\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await savedHistory(page)).toHaveLength(4);
});
