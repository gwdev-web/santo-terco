import AxeBuilder from '@axe-core/playwright';
import { expect, PAGES, test } from './fixtures.js';

/** Opens a page and waits for its data, on the pages that load any. */
async function open(page, path) {
  await page.goto(path);
  const main = page.locator('main');
  if (await main.getAttribute('aria-busy')) await expect(main).toHaveAttribute('aria-busy', 'false');
}

for (const path of PAGES) {
  test.describe(path, () => {
    test('loads without console errors and has a title and one h1', async ({ page }) => {
      await open(page, path);
      await expect(page).toHaveTitle(/Santo Terço/);
      await expect(page.locator('h1:visible')).toHaveCount(1);
    });

    test('has no accessibility violations (axe, WCAG 2.2 AA)', async ({ page }) => {
      await open(page, path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(', ')}`)).toEqual([]);
    });

    test('has no accessibility violations in the dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await open(page, path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa']).analyze();
      expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(', ')}`)).toEqual([]);
    });

    test('never scrolls sideways', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'the widths are set by hand; once is enough');

      // Opened at each width, as a device would (a resize can overflow for one frame while the layout settles)
      for (const width of [360, 390, 768, 1024, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 800 });
        await open(page, path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${width}px wide`).toBeLessThanOrEqual(0);
      }
    });
  });
}

// The browser warns about an unused preload only a few seconds after `load`: in a short test it would
// slip by (Safari, for one, didn't reuse the font preloads and downloaded the fonts twice)
for (const path of ['index.html', 'prayers.html', 'pray.html']) {
  test(`${path} uses everything it preloads`, async ({ page }) => {
    await open(page, path);
    await page.waitForTimeout(4000);
  });
}

test('the skip link moves the focus to the content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'keyboard navigation');
  await open(page, 'index.html');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});
