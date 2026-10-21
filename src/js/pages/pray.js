import { initApp } from '../app.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { createRosaryProgress } from '../components/rosary-progress.js';
import { createStepCard } from '../components/step-card.js';
import { getStreak } from '../services/history.js';
import { getMysterySets, getSetForDate } from '../services/mysteries.js';
import { getPrayerBook, getPrayersById } from '../services/prayers.js';
import { getProgress, saveProgress } from '../services/progress.js';
import { buildStages, countPrayers, getRosary, isStageDone, isStepDone } from '../services/rosary.js';
import { toDateKey } from '../utils/date.js';
import { cloneTemplate, qs } from '../utils/dom.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

initApp();
initPray(qs('[data-pray]'));

/**
 * Guided terço: `pray.html?mystery=<set id>&step=<opening | 1…5 | closing>`.
 * Without `mystery`, today's set; without `step`, the first stage not finished yet,
 * so the user continues where they stopped.
 *
 * @param {HTMLElement} root - The page's <main>, marked with `data-pray`.
 */
function initPray(root) {
  const today = new Date();
  const params = new URLSearchParams(window.location.search);

  initDataLoader(
    root,
    async () => {
      const [sets, book, rosary] = await Promise.all([getMysterySets(), getPrayerBook(), getRosary()]);
      const set = sets.find((item) => item.id === params.get('mystery')) ?? getSetForDate(sets, today);
      const stages = buildStages(rosary, set, getPrayersById(book));
      const dateKey = toDateKey(today);
      const counts = getProgress(set.id, dateKey);

      const requested = stages.findIndex((stage) => stage.id === params.get('step'));
      const firstUnfinished = stages.findIndex((stage) => !isStageDone(stage, counts));
      const stageIndex = requested >= 0 ? requested : Math.max(0, firstUnfinished);

      renderStage(root, { set, stages, stageIndex, dateKey, counts, streak: getStreak(today) });
    },
    { onError: () => (qs('[data-set-name]').textContent = 'Terço guiado') },
  );
}

/**
 * Renders one stage and keeps it in sync with what the user marks.
 *
 * @param {HTMLElement} root
 * @param {object} context
 * @param {import('../services/mysteries.js').MysterySet} context.set
 * @param {import('../services/rosary.js').Stage[]} context.stages
 * @param {number} context.stageIndex
 * @param {string} context.dateKey
 * @param {Record<string, number>} context.counts - Saved progress of today's terço for this set.
 * @param {number} context.streak
 */
function renderStage(root, { set, stages, stageIndex, dateKey, counts, streak }) {
  const stage = stages[stageIndex];
  let progress = { ...counts };

  document.title = `${stage.title} · ${set.name} · Santo Terço`;
  renderHeader(set);
  renderIntro(root, stage, stageIndex, stages.length);
  renderNext(root, set, stages[stageIndex + 1]);

  qs('[data-trail]', root).replaceChildren();
  const trail = createRosaryProgress(qs('[data-rosary-progress]', root), stages, stageIndex);

  const cards = stage.steps.map((step, index) =>
    createStepCard(step, { number: index + 1, onChange: (value) => mark(step, value) }),
  );
  qs('[data-steps]', root).replaceChildren(...cards.map((card) => card.element));

  const listItems = stage.steps.map((step) => {
    const item = cloneTemplate('stage-list-item-template');
    qs('[data-list-title]', item).textContent = step.title;
    return qs('[data-list-item]', item);
  });
  qs('[data-stage-list]', root).replaceChildren(...listItems);

  update();

  function mark(step, value) {
    const wasDone = isStepDone(step, progress);

    progress = { ...progress, [step.key]: value };
    saveProgress(set.id, dateKey, progress);
    update();

    if (!wasDone && isStepDone(step, progress)) revealCurrentStep();
  }

  function update() {
    const done = stage.steps.map((step) => isStepDone(step, progress));
    const current = done.indexOf(false);
    const stageDone = current === -1;

    cards.forEach((card, index) => {
      const state = done[index] ? 'done' : index === current ? 'current' : 'upcoming';
      card.update(progress[stage.steps[index].key] ?? 0, state);
    });

    listItems.forEach((item, index) => {
      item.classList.toggle('stage-list__item--done', done[index]);
      item.classList.toggle('stage-list__item--current', index === current);
      qs('[data-list-state]', item).textContent = done[index] ? ', rezada' : index === current ? ', a próxima' : '';
    });

    renderCompletion(root, stage, stageDone);
    qs('[data-next-link]', root).classList.toggle('motion-breathe', stageDone);

    trail.update({
      ...countPrayers(stages, progress),
      stagesDone: stages.map((item) => isStageDone(item, progress)),
      streak,
    });
  }

  /** After a step is done, brings the next one into view if it is off screen. */
  function revealCurrentStep() {
    const next = qs('.step-card--current', root);
    if (!next) return;

    const { top, bottom } = next.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      next.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }
}

/** Set name and illustration in the focus header. */
function renderHeader(set) {
  qs('[data-set-name]').textContent = set.name;
  setIllustration(qs('[data-set-illustration]'), set.illustration);
}

function renderIntro(root, stage, stageIndex, stageCount) {
  qs('[data-stage-eyebrow]', root).textContent = `Etapa ${stageIndex + 1} de ${stageCount}`;
  qs('[data-stage-title]', root).textContent = stage.title;
  qs('[data-stage-lead]', root).textContent = stage.lead;
}

/** "A seguir": link to the next stage (none after the closing prayers). */
function renderNext(root, set, nextStage) {
  const next = qs('[data-next]', root);
  next.hidden = !nextStage;
  if (!nextStage) return;

  const isMystery = nextStage.kind === 'mystery';

  qs('[data-next-title]', root).textContent = isMystery
    ? `${nextStage.trailLabel} Mistério · ${nextStage.title}`
    : nextStage.title;
  qs('[data-next-label]', root).textContent = isMystery
    ? `Ir para o ${nextStage.name}`
    : `Ir para as ${nextStage.name.toLowerCase()}`;
  qs('[data-next-link]', root).href =
    `/pray.html?mystery=${encodeURIComponent(set.id)}&step=${encodeURIComponent(nextStage.id)}`;
  setIllustration(qs('[data-next-illustration]', root), nextStage.illustration);
}

/** The medal message when every prayer of the stage is marked. */
function renderCompletion(root, stage, stageDone) {
  const container = qs('[data-stage-complete]', root);

  if (!stageDone) {
    container.replaceChildren();
    return;
  }
  if (container.childElementCount) return;

  const item = cloneTemplate('stage-complete-template');
  qs('[data-complete-title]', item).textContent = stage.completedTitle;
  qs('[data-complete-text]', item).textContent = stage.completedText;
  setIllustration(qs('[data-complete-illustration]', item), stage.illustration);
  container.replaceChildren(item);
}
