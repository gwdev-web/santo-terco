import { initApp } from '../app.js';
import { createCelebration } from '../components/celebration.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { getRosaryRound, getStreak } from '../services/history.js';
import { getMysterySets } from '../services/mysteries.js';
import { toDateKey } from '../utils/date.js';
import { cloneTemplate, qs } from '../utils/dom.js';
import { joinNames } from '../utils/text.js';
import { appUrl } from '../utils/url.js';

initApp();
initRosaryComplete(qs('[data-rosary-complete]'));

/**
 * Full Rosary: the four sets prayed on the same day. The ring draws, the four medals
 * and the Rosary medal pop in and the text fades up, with an invitation to pray another one.
 * Opened without a full Rosary today, it calmly shows which sets are left instead.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-rosary-complete`.
 */
function initRosaryComplete(root) {
  const celebration = createCelebration(root);

  initDataLoader(root, async () => {
    const today = new Date();
    const dateKey = toDateKey(today);
    const sets = await getMysterySets();
    const { completed, prayedIds } = getRosaryRound(
      sets.map((set) => set.id),
      dateKey,
    );

    if (completed > 0) {
      // The Rosary just completed: all four medals, whatever was prayed since toward the next one
      renderRing(root, sets, new Set(sets.map((set) => set.id)), true);
      renderComplete(root, sets, completed, prayedIds, getStreak(today));
      celebration.play();
    } else {
      renderRing(root, sets, prayedIds, false);
      renderPending(root, sets, prayedIds);
    }
  });
}

/**
 * The four sets around the ring (top, right, bottom, left), the ones prayed today in light medals.
 * The gold ring draws only for a full Rosary.
 */
function renderRing(root, sets, prayedIds, complete) {
  qs('[data-ring]', root).style.setProperty('--ring-progress', complete ? '1' : '0');
  qs('[data-sets]', root).replaceChildren(
    ...sets.map((set, index) => {
      const fragment = cloneTemplate('ring-set-template');
      const item = qs('[data-set]', fragment);
      const done = prayedIds.has(set.id);

      item.style.setProperty('--set-index', String(index));
      item.style.setProperty('--set-count', String(sets.length));
      item.style.setProperty('--pop-delay', `${0.6 + index * 0.4}s`);
      item.classList.toggle('rosary-complete__set--done', done);
      qs('[data-set-name]', item).textContent = set.shortName;
      qs('[data-set-check]', item).hidden = !done;
      setIllustration(qs('[data-set-illustration]', item), set.illustration);
      return fragment;
    }),
  );
}

/** Full Rosary: the count of the day, and an invitation to pray another (the count starts again). */
function renderComplete(root, sets, rosaries, nextPrayedIds, streak) {
  const amount = document.createElement('em');
  amount.textContent = rosaries === 1 ? 'um Rosário' : `${rosaries} Rosários`;
  const nextCount = sets.filter((set) => nextPrayedIds.has(set.id)).length;

  qs('[data-eyebrow]', root).textContent = 'Parabéns!';
  qs('[data-title]', root).replaceChildren('Você completou ', amount, ' hoje');
  qs('[data-lead]', root).textContent =
    `Os vinte mistérios da vida de Jesus e de Maria, meditados num só dia. Que Nossa Senhora interceda por suas intenções. ${
      nextCount
        ? `Para o próximo Rosário, você já rezou ${nextCount} de ${sets.length} terços.`
        : 'Se quiser, comece outro: cada Rosário rezado conta.'
    }`;
  qs('[data-primary]', root).href = appUrl('mysteries.html');
  qs('[data-primary-label]', root).textContent = 'Rezar outro Rosário';
  qs('[data-secondary]', root).href = appUrl('history.html');
  qs('[data-secondary]', root).textContent = 'Ver meu histórico';
  qs('[data-count]', root).textContent = String(rosaries);
  qs('[data-count-label]', root).textContent = rosaries === 1 ? 'Rosário completo hoje' : 'Rosários completos hoje';
  qs('[data-streak]', root).textContent = streak >= 2 ? ` · ${streak} dias seguidos` : '';
  qs('[data-facts]', root).hidden = false;
}

/** No full Rosary today yet: which sets were prayed and which are left. */
function renderPending(root, sets, prayedIds) {
  const prayed = sets.filter((set) => prayedIds.has(set.id));
  const left = sets.filter((set) => !prayedIds.has(set.id));
  const names = (list) => joinNames(list.map((set) => `os ${set.name}`));

  root.classList.add('rosary-complete--pending');
  qs('[data-eyebrow]', root).textContent = 'Rosário de hoje';
  qs('[data-title]', root).textContent =
    left.length === 1 ? 'Falta 1 terço para o Rosário de hoje' : `Faltam ${left.length} terços para o Rosário de hoje`;
  qs('[data-lead]', root).textContent = prayed.length
    ? `Você já rezou ${names(prayed)}. Para completar o Rosário, faltam ${names(left)}.`
    : 'Reze os quatro terços no mesmo dia para completar um Rosário: os vinte mistérios da vida de Jesus e de Maria.';
  qs('[data-primary]', root).href = appUrl('mysteries.html');
  qs('[data-primary-label]', root).textContent = 'Escolher um mistério';
}
