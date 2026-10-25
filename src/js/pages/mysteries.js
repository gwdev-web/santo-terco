import { initApp } from '../app.js';
import { MOBILE_MEDIA_QUERY } from '../config.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { initTabs } from '../components/tabs.js';
import { getRosaryRound } from '../services/history.js';
import { getMysterySets, getSetForDate } from '../services/mysteries.js';
import { toDateKey } from '../utils/date.js';
import { cloneTemplate, qs } from '../utils/dom.js';
import { appUrl } from '../utils/url.js';

initApp();
initMysteries(qs('[data-mysteries]'));

/**
 * Mysteries: the four sets with their five mysteries, and today's Rosary progress.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-mysteries`.
 */
function initMysteries(root) {
  const today = new Date();

  initDataLoader(root, async () => {
    const sets = await getMysterySets();
    const todaySet = getSetForDate(sets, today);
    const { completed, prayedIds } = getRosaryRound(
      sets.map((set) => set.id),
      toDateKey(today),
    );

    renderRing(root, sets, prayedIds, completed);
    renderSets(root, sets, todaySet, prayedIds);
    initTabs(qs('[data-mysteries-sets]', root), { media: MOBILE_MEDIA_QUERY });
  });
}

/**
 * "1 de 4 terços" with a ring that fills as the sets are prayed; after a full Rosary
 * it starts again for the next one ("2º Rosário de hoje").
 */
function renderRing(root, sets, prayedIds, completed) {
  const count = sets.filter((set) => prayedIds.has(set.id)).length;

  qs('[data-ring-label]', root).textContent = completed ? `${completed + 1}º Rosário de hoje` : 'Rosário de hoje';
  qs('[data-ring-count]', root).textContent = `${count} de ${sets.length} terços`;
  qs('[data-ring-value]', root).style.strokeDashoffset = String(100 - (count / sets.length) * 100);
}

/** One tab and one card per set; today's tab starts selected. */
function renderSets(root, sets, todaySet, prayedIds) {
  qs('[data-tab-list]', root).replaceChildren(...sets.map((set) => renderTab(set, set.id === todaySet.id)));
  qs('[data-card-grid]', root).replaceChildren(
    ...sets.map((set, index) => renderCard(set, index, set.id === todaySet.id, prayedIds.has(set.id))),
  );
}

function renderTab(set, selected) {
  const item = cloneTemplate('mystery-tab-template');
  const tab = qs('[data-tab]', item);

  tab.id = `tab-${set.id}`;
  tab.setAttribute('aria-controls', `set-${set.id}`);
  tab.setAttribute('aria-selected', String(selected));
  qs('[data-tab-label]', item).textContent = set.shortName;
  setIllustration(qs('[data-tab-illustration]', item), set.illustration);

  return item;
}

function renderCard(set, index, isToday, prayed) {
  const item = cloneTemplate('mystery-card-template');
  const card = qs('[data-card]', item);
  const action = qs('[data-card-action]', item);

  card.id = `set-${set.id}`;
  card.setAttribute('aria-labelledby', `set-${set.id}-title`);
  card.classList.toggle('mystery-card--highlight', isToday || prayed);
  card.style.setProperty('--stagger-index', String(index));

  qs('[data-card-title]', item).id = `set-${set.id}-title`;
  qs('[data-card-name]', item).textContent = set.shortName;
  qs('[data-card-days]', item).textContent = set.weekdaysLabel;
  qs('[data-card-done]', item).hidden = !prayed;
  qs('[data-card-today]', item).hidden = prayed || !isToday;
  setIllustration(qs('[data-card-illustration]', item), set.illustration);

  qs('[data-card-list]', item).replaceChildren(...set.mysteries.map(renderMystery));

  action.href = appUrl(`pray.html?mystery=${encodeURIComponent(set.id)}`);
  action.classList.toggle('button--secondary', !prayed);
  action.classList.toggle('button--outline', prayed);
  qs('[data-card-action-label]', item).textContent = prayed ? 'Rezar novamente' : 'Rezar este terço';

  return item;
}

function renderMystery(mystery, index) {
  const item = cloneTemplate('mystery-item-template');

  qs('[data-item-ordinal]', item).textContent = `${index + 1}º mistério`;
  qs('[data-item-title]', item).textContent = mystery.shortTitle;
  qs('[data-item-reference]', item).textContent = mystery.reference;
  setIllustration(qs('[data-item-illustration]', item), mystery.illustration);

  return item;
}
