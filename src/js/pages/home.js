import { initApp } from '../app.js';
import { setIllustration } from '../components/illustration.js';
import { getSetIdsPrayedOn } from '../services/history.js';
import { getMysterySets, getSetForDate } from '../services/mysteries.js';
import { formatShortDate, getWeek, toDateKey, weekdayName, weekdayShortName } from '../utils/date.js';
import { cloneTemplate, qs, qsa } from '../utils/dom.js';

const DURATION_NOTE = 'Cerca de 20 minutos, com cada oração na tela e marcação opcional.';

initApp();
initHome(qs('[data-home]'));

/**
 * Home: today's terço, the mysteries of the week and today's Rosary progress.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-home`.
 */
function initHome(root) {
  const today = new Date();
  const error = qs('[data-home-error]', root);
  const retry = qs('[data-home-retry]', root);

  qs('[data-today-date]', root).textContent = `${weekdayName(today)}, ${formatShortDate(today)}`;
  retry.addEventListener('click', load);
  load();

  async function load() {
    root.setAttribute('aria-busy', 'true');
    retry.disabled = true;

    try {
      const sets = await getMysterySets();
      const todaySet = getSetForDate(sets, today);

      renderToday(root, todaySet);
      renderWeek(qs('[data-week]', root), sets, today);
      renderRosary(root, sets, todaySet, getSetIdsPrayedOn(toDateKey(today)));
      showData(true);
    } catch (loadError) {
      console.error(loadError);
      renderTodayFallback(root);
      showData(false);
    } finally {
      root.setAttribute('aria-busy', 'false');
      retry.disabled = false;
    }
  }

  /** Shows the data sections, or the error notice in their place. */
  function showData(visible) {
    error.hidden = visible;
    for (const section of qsa('[data-home-data]', root)) section.hidden = !visible;
  }
}

/** Hero: name, summary and start link of today's set. */
function renderToday(root, set) {
  const name = document.createElement('span');
  name.className = 'today__set';
  name.textContent = set.name;

  qs('[data-today-title]', root).replaceChildren('Hoje rezamos os ', name);
  qs('[data-today-lead]', root).textContent = `${set.summary} ${DURATION_NOTE}`;
  qs('[data-today-start]', root).href = prayUrl(set);
  qs('[data-today-badge]', root).hidden = false;
  setIllustration(qs('[data-today-illustration]', root), set.illustration);
  setIllustration(qs('[data-today-art]', root), set.illustration);
}

/** Hero without data: a neutral title, and the start link keeps pointing to the Mysteries page. */
function renderTodayFallback(root) {
  qs('[data-today-title]', root).textContent = 'Hoje rezamos o terço do dia';
  qs('[data-today-lead]', root).textContent = DURATION_NOTE;
  qs('[data-today-badge]', root).hidden = true;
}

/** The seven days, Monday to Sunday, each with its set; today is marked with aria-current="date". */
function renderWeek(list, sets, today) {
  const todayKey = toDateKey(today);

  list.replaceChildren(
    ...getWeek(today).map((day) => {
      const set = getSetForDate(sets, day);
      const item = cloneTemplate('week-day-template');

      qs('[data-day-short]', item).textContent = weekdayShortName(day);
      qs('[data-day-date]', item).textContent = String(day.getDate());
      qs('[data-day-full]', item).textContent = `${weekdayName(day)}, dia ${day.getDate()}: `;
      qs('[data-day-set]', item).textContent = set.shortName;
      setIllustration(qs('[data-day-illustration]', item), set.illustration);

      if (toDateKey(day) === todayKey) {
        qs('.week__day', item).setAttribute('aria-current', 'date');
        qs('[data-day-today]', item).hidden = false;
      }

      return item;
    }),
  );
}

/** Today's Rosary: how many of the four sets were prayed today, and a link to each one. */
function renderRosary(root, sets, todaySet, prayedIds) {
  const prayedCount = sets.filter((set) => prayedIds.has(set.id)).length;
  const status = qs('[data-rosary-status]', root);

  status.textContent =
    prayedCount === sets.length
      ? 'Rosário completo! Você rezou os quatro terços hoje.'
      : `${prayedCount} de ${sets.length} terços · reze os quatro para completar um Rosário`;

  qsa('.rosary-today__segment', qs('[data-rosary-progress]', root)).forEach((segment, index) => {
    segment.classList.toggle('rosary-today__segment--filled', index < prayedCount);
  });

  qs('[data-rosary-sets]', root).replaceChildren(
    ...sets.map((set) => {
      const item = cloneTemplate('rosary-set-template');
      const link = qs('[data-set-link]', item);
      const prayed = prayedIds.has(set.id);

      link.href = prayUrl(set);
      link.classList.toggle('rosary-set--today', set.id === todaySet.id);
      qs('[data-set-name]', item).textContent = set.shortName;
      qs('[data-set-days]', item).textContent = set.weekdaysLabel;
      qs('[data-set-today]', item).hidden = set.id !== todaySet.id;
      qs('[data-set-action]', item).hidden = prayed;
      qs('[data-set-done]', item).hidden = !prayed;
      setIllustration(qs('[data-set-illustration]', item), set.illustration);

      return item;
    }),
  );
}

/** @returns {string} Link to the guided terço of a set. */
function prayUrl(set) {
  return `/pray.html?mystery=${encodeURIComponent(set.id)}`;
}
