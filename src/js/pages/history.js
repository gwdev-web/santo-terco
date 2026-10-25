import { initApp } from '../app.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { clearHistory, countRosaries, getHistory, getLongestStreak, getStreak } from '../services/history.js';
import { getMysterySets } from '../services/mysteries.js';
import { clearAllProgress } from '../services/progress.js';
import { formatShortDate, getWeek, toDateKey, weekdayName, weekdayShortName } from '../utils/date.js';
import { cloneTemplate, qs } from '../utils/dom.js';
import { joinNames } from '../utils/text.js';

const HEATMAP_WEEKS = 12;
const RECENT_DAYS = 6;
const HEATMAP_LABELS = ['Seg', '', 'Qua', '', 'Sex', '', 'Dom'];

/** Medals earned from the history; nothing extra is stored. */
const MEDALS = [
  {
    name: 'Primeiro terço',
    illustration: 'ave-maria',
    goal: 'Conclua o seu primeiro terço',
    earned: ({ total }) => total > 0,
  },
  {
    name: 'Rosário completo',
    illustration: 'terco',
    goal: 'Reze os quatro terços no mesmo dia',
    earned: ({ rosaries }) => rosaries > 0,
  },
  ...[3, 7, 30].map((days) => ({
    name: `${days} dias seguidos`,
    illustration: 'gloriosos-coroa',
    goal: `Reze ${days} dias sem pular`,
    earned: ({ longestStreak }) => longestStreak >= days,
  })),
];

initApp();
initHistory(qs('[data-history]'));

/**
 * History: this week, the numbers, the last 12 weeks, the terços per set,
 * recent days and medals, all from the terços saved in this browser.
 * "Limpar meus dados" asks for confirmation in place.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-history`.
 */
function initHistory(root) {
  let sets = [];

  initClearData(root, () => {
    render(root, sets, { cleared: true });
    qs('[data-empty]', root).focus();
  });

  // The history is in this browser: without records there is nothing to load
  if (getHistory().length === 0) {
    render(root, sets);
    root.setAttribute('aria-busy', 'false');
    return;
  }

  initDataLoader(root, async () => {
    sets = await getMysterySets();
    render(root, sets);
  });
}

/**
 * @param {HTMLElement} root
 * @param {import('../services/mysteries.js').MysterySet[]} sets
 * @param {{ cleared?: boolean }} [options]
 */
function render(root, sets, { cleared = false } = {}) {
  const today = new Date();
  const entries = getHistory();
  const days = groupByDay(entries);
  const empty = entries.length === 0;

  qs('[data-empty]', root).hidden = !empty;
  qs('[data-content]', root).hidden = empty;
  qs('[data-clear]', root).hidden = empty;
  qs('[data-empty-title]', root).textContent = cleared ? 'Seus dados foram apagados' : 'Nenhum registro ainda';
  if (empty) return;

  const setIds = sets.map((set) => set.id);
  const rosaries = [...days.values()].reduce((sum, dayEntries) => sum + countRosaries(dayEntries, setIds), 0);
  const streak = getStreak(today);
  const heatmapDays = getHeatmapDays(today);
  const recentTotal = heatmapDays.reduce((sum, day) => sum + (days.get(toDateKey(day))?.length ?? 0), 0);

  qs('[data-stat-total]', root).textContent = String(recentTotal);
  qs('[data-stat-rosaries]', root).textContent = String(rosaries);
  qs('[data-stat-streak]', root).textContent = String(streak);
  qs('[data-stat-days]', root).textContent = String(days.size);

  renderWeek(root, days, today);
  renderHeatmap(root, days, heatmapDays, today);
  renderBySet(root, sets, entries);
  renderRecent(root, sets, days, today);
  renderMedals(root, { total: entries.length, rosaries, longestStreak: getLongestStreak() });
}

/** "Esta semana": one bar per day, Monday to Sunday; a full Rosary in bright gold. */
function renderWeek(root, days, today) {
  const todayKey = toDateKey(today);
  let total = 0;

  qs('[data-week]', root).replaceChildren(
    ...getWeek(today).map((day) => {
      const fragment = cloneTemplate('week-bar-template');
      const item = qs('[data-day]', fragment);
      const key = toDateKey(day);
      const count = days.get(key)?.length ?? 0;
      const future = key > todayKey;

      total += count;
      item.style.setProperty('--day-level', String(Math.min(count, 4) / 4));
      item.classList.toggle('history-week__day--rosary', count >= 4);
      item.classList.toggle('history-week__day--future', future);
      if (key === todayKey) item.setAttribute('aria-current', 'date');

      qs('[data-day-count]', item).textContent = future ? '' : String(count);
      qs('[data-day-label]', item).textContent = weekdayShortName(day);
      qs('[data-day-text]', item).textContent =
        `${weekdayName(day)}: ${future ? 'ainda não chegou' : countLabel(count)}`;
      return fragment;
    }),
  );

  qs('[data-week-total]', root).textContent = countLabel(total);
}

/** The last 12 weeks, Monday to Sunday, from the week 11 weeks ago to this one. */
function getHeatmapDays(today) {
  const [monday] = getWeek(today);

  return Array.from(
    { length: HEATMAP_WEEKS * 7 },
    (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - (HEATMAP_WEEKS - 1) * 7 + index),
  );
}

/** One square per day, darker with more terços (4 = a full Rosary, in navy); one column per week. */
function renderHeatmap(root, days, heatmapDays, today) {
  const heatmap = qs('[data-heatmap]', root);
  const todayKey = toDateKey(today);
  let prayedDays = 0;
  let total = 0;

  const labels = HEATMAP_LABELS.map((text) => {
    const label = document.createElement('span');
    label.className = 'heatmap__label';
    label.textContent = text;
    return label;
  });

  const squares = heatmapDays.map((day) => {
    const key = toDateKey(day);
    const count = days.get(key)?.length ?? 0;
    const square = document.createElement('span');

    if (count > 0) prayedDays += 1;
    total += count;
    square.className = `heatmap__day heatmap__day--${key > todayKey ? 'future' : Math.min(count, 4)}`;
    if (key <= todayKey) square.title = `${formatShortDate(day)}: ${countLabel(count)}`;
    return square;
  });

  heatmap.replaceChildren(...labels, ...squares);
  heatmap.setAttribute(
    'aria-label',
    `Terços por dia nas últimas 12 semanas: ${prayedDays} ${prayedDays === 1 ? 'dia' : 'dias'} com oração, ${countLabel(total)}.`,
  );
}

/** "Por mistério": every terço finished, per set, with bars relative to the most prayed. */
function renderBySet(root, sets, entries) {
  const counts = sets.map((set) => entries.filter((entry) => entry.setId === set.id).length);
  const max = Math.max(...counts, 1);

  qs('[data-by-set]', root).replaceChildren(
    ...sets.map((set, index) => {
      const item = cloneTemplate('by-set-template');

      qs('[data-set-name]', item).textContent = set.shortName;
      qs('[data-set-count]', item).textContent = String(counts[index]);
      qs('[data-set-bar]', item).style.setProperty('--progress', `${Math.round((counts[index] / max) * 100)}%`);
      setIllustration(qs('[data-set-illustration]', item), set.illustration);
      return item;
    }),
  );
}

/** The last days with prayer, newest first: a full Rosary, one set or the sets prayed that day. */
function renderRecent(root, sets, days, today) {
  const setsById = new Map(sets.map((set) => [set.id, set]));
  const setIds = sets.map((set) => set.id);
  const keys = [...days.keys()].sort().reverse().slice(0, RECENT_DAYS);

  qs('[data-recent]', root).replaceChildren(
    ...keys.map((key) => {
      const item = cloneTemplate('recent-template');
      const dayEntries = days.get(key);
      const dayIds = [...new Set(dayEntries.map((entry) => entry.setId))];
      const daySets = dayIds.map((id) => setsById.get(id)).filter(Boolean);
      const rosaries = countRosaries(dayEntries, setIds);
      const single = daySets.length === 1 ? daySets[0] : null;

      qs('[data-recent-date]', item).textContent = dayLabel(key, today);
      qs('[data-recent-title]', item).textContent = rosaries
        ? rosaries === 1
          ? 'Rosário completo'
          : `${rosaries} Rosários completos`
        : (single?.name ?? joinNames(daySets.map((set) => set.shortName)));
      qs('[data-recent-extra]', item).textContent = dayEntries.length > 1 ? countLabel(dayEntries.length) : '';
      setIllustration(qs('[data-recent-illustration]', item), rosaries || !single ? 'terco' : single.illustration);
      return item;
    }),
  );
}

function renderMedals(root, stats) {
  qs('[data-medals]', root).replaceChildren(
    ...MEDALS.map((medal) => {
      const fragment = cloneTemplate('medal-template');
      const item = qs('[data-medal]', fragment);
      const earned = medal.earned(stats);

      item.classList.toggle('medals__item--earned', earned);
      qs('[data-medal-icon]', item).classList.toggle('medal--done', earned);
      qs('[data-medal-name]', item).textContent = medal.name;
      qs('[data-medal-detail]', item).textContent = earned ? 'Conquistada' : medal.goal;
      setIllustration(qs('[data-medal-illustration]', item), medal.illustration);
      return fragment;
    }),
  );
}

/**
 * "Limpar meus dados" → "Apagar todo o histórico?" with Cancelar / Sim, apagar, in place.
 * Focus goes to "Cancelar", the safe choice, and back to the button on cancel.
 */
function initClearData(root, onCleared) {
  const clear = qs('[data-clear]', root);
  const confirm = qs('[data-confirm]', root);
  const cancel = qs('[data-confirm-cancel]', root);

  const ask = (asking) => {
    clear.hidden = asking;
    confirm.hidden = !asking;
  };

  clear.addEventListener('click', () => {
    ask(true);
    cancel.focus();
  });

  cancel.addEventListener('click', () => {
    ask(false);
    clear.focus();
  });

  qs('[data-confirm-clear]', root).addEventListener('click', () => {
    clearHistory();
    clearAllProgress();
    ask(false);
    onCleared();
  });
}

/** @returns {Map<string, import('../services/history.js').HistoryEntry[]>} Entries per day key. */
function groupByDay(entries) {
  const days = new Map();
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  return days;
}

/** "Hoje", "Ontem" or "17 out". */
function dayLabel(key, today) {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (key === toDateKey(today)) return 'Hoje';
  if (key === toDateKey(yesterday)) return 'Ontem';

  const [year, month, day] = key.split('-').map(Number);
  return formatShortDate(new Date(year, month - 1, day));
}

/** "1 terço", "3 terços". */
function countLabel(count) {
  return `${count} ${count === 1 ? 'terço' : 'terços'}`;
}
