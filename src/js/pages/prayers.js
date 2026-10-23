import { initApp } from '../app.js';
import { MOBILE_MEDIA_QUERY } from '../config.js';
import { initDataLoader } from '../components/data-loader.js';
import { initDisclosure } from '../components/disclosure.js';
import { setIllustration } from '../components/illustration.js';
import { initTabs } from '../components/tabs.js';
import { initTextSize } from '../components/text-size.js';
import { getPrayerBook } from '../services/prayers.js';
import { cloneTemplate, qs } from '../utils/dom.js';
import { appUrl } from '../utils/url.js';

/** Litany lines shown before "Mostrar a ladainha inteira". */
const LITANY_PREVIEW_LINES = 12;
const COPY_FEEDBACK_MS = 2500;
const copyTimers = new WeakMap();

initApp();
initPrayers(qs('[data-prayers]'));

/**
 * Prayers: the rosary prayers in order, complementary prayers and litanies.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-prayers`.
 */
function initPrayers(root) {
  initTextSize(qs('[data-text-size-control]', root));
  initTabs(qs('[data-prayer-tabs]', root), { media: MOBILE_MEDIA_QUERY });

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy]');
    if (button) copyPrayer(button, qs('[data-copy-status]', root));
  });

  initDataLoader(root, async () => {
    const book = await getPrayerBook();

    qs('[data-rosary-groups]', root).replaceChildren(...book.rosaryGroups.map(renderGroup));
    qs('[data-complementary]', root).replaceChildren(...book.complementary.map((prayer) => renderPrayer(prayer, 3)));
    qs('[data-litanies]', root).replaceChildren(...book.litanies.map(renderLitany));
  });
}

/** "1 · No início": a numbered group of rosary prayers. */
function renderGroup(group, index) {
  const item = cloneTemplate('prayer-group-template');

  qs('[data-group-number]', item).textContent = String(index + 1);
  qs('[data-group-title]', item).textContent = group.title;
  qs('[data-group-description]', item).textContent = group.description;
  qs('[data-group-prayers]', item).replaceChildren(...group.prayers.map((prayer) => renderPrayer(prayer, 4)));

  return item;
}

/**
 * @param {import('../services/prayers.js').Prayer} prayer
 * @param {3 | 4} headingLevel - h3 for complementary prayers, h4 inside a rosary group.
 */
function renderPrayer(prayer, headingLevel) {
  const item = cloneTemplate('prayer-card-template');
  const title = setHeadingLevel(qs('[data-prayer-title]', item), headingLevel);

  title.textContent = prayer.title;
  qs('[data-prayer-when]', item).textContent = prayer.when;
  qs('[data-prayer-text]', item).textContent = prayer.text;
  setIllustration(qs('[data-prayer-illustration]', item), prayer.illustration);

  return item;
}

/** A litany: the first lines, then the rest and the closing prayer behind a toggle. */
function renderLitany(litany) {
  const item = cloneTemplate('litany-template');
  const panelId = `${litany.id}-more`;
  const titleId = `${litany.id}-title`;
  const hiddenCount = Math.max(0, litany.lines.length - LITANY_PREVIEW_LINES);
  const toggle = qs('[data-litany-toggle]', item);

  qs('[data-litany]', item).setAttribute('aria-labelledby', titleId);
  qs('[data-litany-title]', item).id = titleId;
  qs('[data-litany-title]', item).textContent = litany.title;
  qs('[data-litany-note]', item).textContent = `${litany.note} · ${litany.lines.length} invocações`;
  setIllustration(qs('[data-litany-illustration]', item), litany.illustration);

  qs('[data-litany-preview]', item).replaceChildren(...litany.lines.slice(0, LITANY_PREVIEW_LINES).map(renderLine));
  qs('[data-litany-rest]', item).replaceChildren(...litany.lines.slice(LITANY_PREVIEW_LINES).map(renderLine));
  qs('[data-litany-closing]', item).textContent = litany.closingPrayer;

  qs('[data-litany-panel]', item).id = panelId;
  toggle.setAttribute('aria-controls', panelId);
  qs('[data-litany-more]', item).textContent =
    hiddenCount > 0 ? `Mostrar a ladainha inteira (mais ${hiddenCount} invocações)` : 'Mostrar a oração final';
  initDisclosure(toggle);

  return item;
}

function renderLine(line) {
  const item = cloneTemplate('litany-line-template');

  qs('[data-line-invocation]', item).textContent = line.invocation;
  qs('[data-line-response]', item).textContent = line.response;

  return item;
}

/** Replaces a heading with one of another level, keeping its classes and data attributes. */
function setHeadingLevel(heading, level) {
  if (heading.tagName === `H${level}`) return heading;

  const replacement = document.createElement(`h${level}`);
  for (const { name, value } of heading.attributes) replacement.setAttribute(name, value);
  heading.replaceWith(replacement);

  return replacement;
}

/** Copies the prayer's title and text, with feedback on the button and for screen readers. */
async function copyPrayer(button, status) {
  const card = button.closest('[data-prayer]');
  const title = qs('[data-prayer-title]', card).textContent;
  const label = qs('[data-copy-label]', button);
  const icon = qs('[data-copy-icon]', button);
  let copied = true;

  try {
    await navigator.clipboard.writeText(`${title}\n\n${qs('[data-prayer-text]', card).textContent}`);
  } catch {
    copied = false;
  }

  label.textContent = copied ? 'Texto copiado' : 'Não foi possível copiar';
  icon.setAttribute('href', appUrl(copied ? 'icons.svg#check' : 'icons.svg#copy'));
  status.textContent = copied ? `${title}: texto copiado.` : `Não foi possível copiar ${title}.`;

  clearTimeout(copyTimers.get(button));
  copyTimers.set(
    button,
    setTimeout(() => {
      label.textContent = 'Copiar texto';
      icon.setAttribute('href', appUrl('icons.svg#copy'));
    }, COPY_FEEDBACK_MS),
  );
}
