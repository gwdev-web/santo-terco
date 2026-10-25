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

/** "Rezei todas desta etapa", then on to the next stage. */
async function markAllAndContinue(page) {
  await page.getByRole('button', { name: 'Rezei todas desta etapa' }).click();
  await page.locator('[data-next-link]').click();
  await waitForData(page);
}

/** Saves today's terço of a set as if these stages were prayed (stage ids: "opening", "1"…"5"). */
const STAGE_STEPS = { opening: [1, 1, 1, 1, 3, 1], mystery: [1, 10, 1], closing: [1, 1, 1] };
const seedProgress = (page, setId, stageIds) =>
  page.evaluate(
    ({ setId, stageIds, steps, date }) => {
      const counts = {};
      for (const id of stageIds) {
        const [prefix, list] = id === 'opening' ? ['opening', steps.opening] : [`mystery-${id}`, steps.mystery];
        list.forEach((count, index) => (counts[`${prefix}/${index}`] = count));
      }
      localStorage.setItem('santo-terco:progress', JSON.stringify({ date, sets: { [setId]: counts } }));
    },
    { setId, stageIds, steps: STAGE_STEPS, date: TODAY_KEY },
  );

/** Saves finished terços of today in the history. */
const seedHistory = (page, setIds) =>
  page.evaluate(
    ({ setIds, date }) =>
      localStorage.setItem(
        'santo-terco:history',
        JSON.stringify(setIds.map((setId) => ({ setId, date, completedAt: `${date}T08:00:00.000Z` }))),
      ),
    { setIds, date: TODAY_KEY },
  );

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
  await page.goto('index.html');
  await seedProgress(page, 'glorious', ['opening']);
  await page.goto('pray.html?mystery=glorious&step=1');
  await waitForData(page);

  const third = page.getByRole('button', { name: /^3 de 10:/ });
  await third.click();
  await expect(page.getByRole('button', { name: /de 10:/, pressed: true })).toHaveCount(3);
  await third.click();
  await expect(page.getByRole('button', { name: /de 10:/, pressed: true })).toHaveCount(2);
});

test('the next stage opens only when every prayer is marked', async ({ page }) => {
  await page.goto('pray.html?mystery=glorious');
  await waitForData(page);
  const next = page.locator('[data-next-link]');

  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).not.toHaveAttribute('href');
  await expect(page.locator('[data-next-title]')).toHaveText('Faltam 8 orações nesta etapa');

  await page
    .getByRole('button', { name: /^Rezei ?: Sinal da Cruz/ })
    .first()
    .click();
  await expect(page.locator('[data-next-title]')).toHaveText('Faltam 7 orações nesta etapa');

  // Prayed and forgot to tap: one button marks the whole stage
  await page.getByRole('button', { name: 'Rezei todas desta etapa' }).click();
  await expect(page.locator('[data-progress-count]')).toHaveText('8 de 71 orações');
  await expect(page.getByRole('button', { name: 'Rezei todas desta etapa' })).toBeHidden();
  await expect(next).not.toHaveAttribute('aria-disabled');
  await expect(page.locator('[data-next-title]')).toHaveText('1º Mistério · A Ressurreição de Jesus');

  await next.click();
  await expect(page).toHaveURL(/step=1$/);
});

test('a stage further ahead in the URL opens the first unfinished one', async ({ page }) => {
  await page.goto('index.html');
  await seedProgress(page, 'glorious', ['opening', '1']);

  await page.goto('pray.html?mystery=glorious&step=closing');
  await waitForData(page);
  await expect(page.getByText('2º Mistério Glorioso')).toBeVisible();
  await expect(page).toHaveURL(/mystery=glorious&step=2$/);

  // Stages already prayed stay open
  await page.goto('pray.html?mystery=glorious&step=opening');
  await waitForData(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orações iniciais');
});

test('the terço is concluded only with every prayer marked', async ({ page }) => {
  await page.goto('index.html');
  await seedProgress(page, 'glorious', ['opening', '1', '2', '3', '4', '5']);
  await page.goto('pray.html?mystery=glorious&step=closing');
  await waitForData(page);

  const finish = page.getByRole('button', { name: 'Concluir o terço' });
  await expect(finish).toBeDisabled();
  await expect(page.locator('[data-finish-hint]')).toHaveText('Marque as orações finais para concluir o terço.');

  await page.getByRole('button', { name: 'Rezei todas desta etapa' }).click();
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.locator('[data-celebration]')).toBeVisible();
});

test('the fourth terço of the day completes the Rosary, and the count starts again', async ({ page }) => {
  await page.goto('index.html');
  await seedHistory(page, ['joyful', 'sorrowful', 'luminous']);
  await seedProgress(page, 'glorious', ['opening', '1', '2', '3', '4', '5']);

  await page.goto('pray.html?mystery=glorious&step=closing');
  await waitForData(page);
  await page.getByRole('button', { name: 'Rezei todas desta etapa' }).click();
  await page.getByRole('button', { name: 'Concluir o terço' }).click();

  await expect(page).toHaveURL(/rosary-complete\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Você completou um Rosário hoje');
  expect(await savedHistory(page)).toHaveLength(4);

  // An invitation to pray another one, counted from zero
  await page.getByRole('link', { name: 'Rezar outro Rosário' }).click();
  await expect(page).toHaveURL(/mysteries\.html$/);
  await waitForData(page);
  await expect(page.locator('[data-ring-label]')).toHaveText('2º Rosário de hoje');
  await expect(page.locator('[data-ring-count]')).toHaveText('0 de 4 terços');

  await page.goto('index.html');
  await waitForData(page);
  await expect(page.locator('[data-rosary-status]')).toHaveText(
    '1 Rosário completo hoje! Que tal mais um? 0 de 4 terços',
  );
  await expect(page.locator('[data-set-done]:visible')).toHaveCount(0);
});

test('a terço prayed through with "Rezei todas" in every stage', async ({ page }) => {
  await page.goto('pray.html?mystery=luminous');
  await waitForData(page);
  for (let stage = 0; stage < 6; stage += 1) await markAllAndContinue(page);

  await expect(page).toHaveURL(/step=closing$/);
  await page.getByRole('button', { name: 'Rezei todas desta etapa' }).click();
  await page.getByRole('button', { name: 'Concluir o terço' }).click();
  await expect(page.locator('[data-celebration-rosary-title]')).toHaveText('Rosário de hoje · 1 de 4');
});
