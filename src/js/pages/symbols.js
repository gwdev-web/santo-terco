import { initApp } from '../app.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { getMysterySets } from '../services/mysteries.js';
import { getPrayerBook } from '../services/prayers.js';
import { cloneTemplate, qs } from '../utils/dom.js';

initApp();
initSymbols(qs('[data-symbols]'));

/**
 * Symbols and design: the text is in the page; the twenty mysteries and the
 * prayers, each with its illustration, come from the data.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-symbols`.
 */
function initSymbols(root) {
  initDataLoader(root, async () => {
    const [sets, book] = await Promise.all([getMysterySets(), getPrayerBook()]);
    const prayers = [
      ...book.rosaryGroups.flatMap((group) => group.prayers),
      ...book.complementary,
      ...book.litanies,
    ];

    qs('[data-mystery-sets]', root).replaceChildren(
      ...sets.map((set) => {
        const card = cloneTemplate('mystery-set-template');
        qs('[data-set-name]', card).textContent = set.shortName;
        qs('[data-set-mysteries]', card).replaceChildren(
          ...set.mysteries.map((mystery) => createItem(mystery.shortTitle, mystery.illustration)),
        );
        return card;
      }),
    );

    qs('[data-prayers]', root).replaceChildren(
      ...prayers.map((prayer) => createItem(prayer.title, prayer.illustration)),
    );
  });
}

/** One illustration with its name. */
function createItem(name, illustration) {
  const item = cloneTemplate('symbol-item-template');
  qs('[data-item-name]', item).textContent = name;
  setIllustration(qs('[data-item-illustration]', item), illustration);
  return item;
}
