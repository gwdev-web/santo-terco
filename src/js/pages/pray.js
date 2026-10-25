import { initApp } from '../app.js';
import { createCelebration } from '../components/celebration.js';
import { initDataLoader } from '../components/data-loader.js';
import { setIllustration } from '../components/illustration.js';
import { createRosaryProgress } from '../components/rosary-progress.js';
import { createStepCard } from '../components/step-card.js';
import { showStorageNotice } from '../components/storage-notice.js';
import { showToast } from '../components/toast.js';
import { addHistoryEntry, countRosariesOn, getRosaryRound, getStreak } from '../services/history.js';
import { getMysterySets, getSetForDate } from '../services/mysteries.js';
import { getPrayerBook, getPrayersById } from '../services/prayers.js';
import { clearProgress, getProgress, saveProgress } from '../services/progress.js';
import { buildStages, countPrayers, getRosary, isStageDone, isStepDone } from '../services/rosary.js';
import { toDateKey } from '../utils/date.js';
import { cloneTemplate, qs, qsa } from '../utils/dom.js';
import { logWarning } from '../utils/log.js';
import { appUrl } from '../utils/url.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

initApp();
initPray(qs('[data-pray]'));

/**
 * Guided terço: `pray.html?mystery=<set id>&step=<opening | 1…5 | closing>`.
 * Without `mystery`, today's set; without `step`, the first stage not finished yet,
 * so the user continues where they stopped (the closing one when every prayer is marked).
 * A stage opens only when the ones before it are finished: a `step` further ahead
 * shows the first unfinished stage instead.
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
      const requestedSet = sets.find((item) => item.id === params.get('mystery'));
      const set = requestedSet ?? getSetForDate(sets, today);
      const stages = buildStages(rosary, set, getPrayersById(book));
      const dateKey = toDateKey(today);
      const counts = getProgress(set.id, dateKey);

      const requested = stages.findIndex((stage) => stage.id === params.get('step'));
      if (params.has('mystery') && !requestedSet) {
        logWarning(`Unknown mystery "${params.get('mystery')}" in the URL; showing today's set, "${set.id}"`);
      }
      if (params.has('step') && requested < 0) {
        logWarning(`Unknown step "${params.get('step')}" in the URL; continuing where the user stopped`);
      }
      const firstUnfinished = stages.findIndex((stage) => !isStageDone(stage, counts));
      const lastOpen = firstUnfinished >= 0 ? firstUnfinished : stages.length - 1;
      const stageIndex = requested >= 0 ? Math.min(requested, lastOpen) : lastOpen;
      if (requested > lastOpen) window.history.replaceState(null, '', stageUrl(set, stages[stageIndex]));

      renderStage(root, { set, sets, stages, stageIndex, dateKey, counts, streak: getStreak(today) });
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
 * @param {import('../services/mysteries.js').MysterySet[]} context.sets - The four sets, for today's Rosary.
 * @param {import('../services/rosary.js').Stage[]} context.stages
 * @param {number} context.stageIndex
 * @param {string} context.dateKey
 * @param {Record<string, number>} context.counts - Saved progress of today's terço for this set.
 * @param {number} context.streak
 */
function renderStage(root, { set, sets, stages, stageIndex, dateKey, counts, streak }) {
  const stage = stages[stageIndex];
  const isClosing = stage.kind === 'closing';
  let progress = { ...counts };
  let concluded = false;
  let stageWasDone = null; // unknown until the first update
  let toastShown = false;

  document.title = `${stage.title} · ${set.name} · Santo Terço`;
  renderHeader(set);
  renderIntro(root, stage, stageIndex, stages.length);
  renderMeditation(root, set, stage);
  renderNavigation(root, set, stages, stageIndex);

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

  qs('[data-finish]', root).hidden = !isClosing;
  qs('[data-more]', root).hidden = !isClosing;
  if (isClosing) {
    renderMoreRosary(root, sets, getRosaryRound(setIdsOf(sets), dateKey));
    qs('[data-finish-button]', root).addEventListener('click', conclude);
  }

  // For when the user prayed and forgot to tap: marks every prayer of the stage at once
  qs('[data-mark-all-button]', root).addEventListener('click', () => {
    for (const step of stage.steps) progress = { ...progress, [step.key]: step.count };
    if (!saveProgress(set.id, dateKey, progress)) showStorageNotice();
    update();
  });

  update();

  function mark(step, value) {
    progress = { ...progress, [step.key]: value };
    // After "Concluir", the next terço starts clean. A failed save still lets the user pray, with a notice
    if (!concluded && !saveProgress(set.id, dateKey, progress)) showStorageNotice();
    update();
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

    renderCompletion(root, stage, stageDone && !isClosing); // the closing stage ends with the celebration
    // The medal toast only when the stage is finished now, once per visit
    if (stageDone && stageWasDone === false && !isClosing && !toastShown) {
      showToast({ title: stage.completedTitle, text: stage.completedText, illustration: stage.illustration });
      toastShown = true;
    }
    stageWasDone = stageDone;
    const { marked, total } = countPrayers([stage], progress);
    const allDone = stages.every((item) => isStageDone(item, progress));

    qs('[data-mark-all]', root).hidden = stageDone || concluded;
    renderNextLock(root, stageDone, total - marked);
    qs('[data-next-link]', root).classList.toggle('motion-breathe', stageDone);

    const finishButton = qs('[data-finish-button]', root);
    finishButton.disabled = !allDone;
    finishButton.classList.toggle('motion-breathe', allDone);
    qs('[data-finish-hint]', root).textContent = allDone
      ? 'Tudo pronto! Toque para registrar o seu terço.'
      : stageDone
        ? 'Faltam orações em etapas anteriores: volte e marque para concluir.'
        : 'Marque as orações finais para concluir o terço.';

    trail.update({
      ...countPrayers(stages, progress),
      stagesDone: stages.map((item) => isStageDone(item, progress)),
      streak,
    });
  }

  /**
   * "Concluir o terço": saves it in the history and clears today's marks for this set,
   * so praying it again starts from the beginning. The fourth set of the day opens
   * the full Rosary page; otherwise the celebration shows above the stage.
   */
  function conclude() {
    const now = new Date();
    const todayKey = toDateKey(now);
    const setIds = setIdsOf(sets);
    const rosariesBefore = countRosariesOn(setIds, todayKey);

    if (!addHistoryEntry(set.id, now)) showStorageNotice();
    clearProgress(set.id, dateKey);
    concluded = true;

    if (countRosariesOn(setIds, todayKey) > rosariesBefore) {
      window.location.assign(appUrl('rosary-complete.html'));
      return;
    }

    streak = getStreak(now);
    update();

    const round = getRosaryRound(setIds, todayKey);
    qs('[data-finish]', root).hidden = true;
    qs('[data-next]', root).hidden = true;
    renderMoreRosary(root, sets, round);
    showCelebration(root, { set, sets, prayedIds: round.prayedIds, streak });
  }
}

/**
 * "Terço concluído": the set's medal, the streak and today's Rosary (the four sets,
 * the ones prayed today in light medals). The page centers it on the screen and focus moves to it.
 */
function showCelebration(root, { set, sets, prayedIds, streak }) {
  const section = qs('[data-celebration]', root);
  const text = qs('[data-celebration-text]', root);
  const prayedCount = sets.filter((item) => prayedIds.has(item.id)).length;

  setIllustration(qs('[data-celebration-illustration]', root), set.illustration);

  text.replaceChildren(`Você rezou os 5 ${set.name}.`);
  if (streak >= 2) {
    const days = document.createElement('b');
    days.textContent = `${streak} dias seguidos`;
    text.append(' Sua sequência agora é de ', days, '.');
  }

  qs('[data-celebration-rosary-title]', root).textContent = `Rosário de hoje · ${prayedCount} de ${sets.length}`;
  qs('[data-celebration-sets]', root).replaceChildren(
    ...sets.map((item) => {
      const fragment = cloneTemplate('celebration-set-template');
      const entry = qs('[data-celebration-set]', fragment);
      const prayed = prayedIds.has(item.id);

      entry.classList.toggle('celebration__set--done', prayed);
      if (item.id === set.id) {
        const medal = qs('.medal', entry);
        medal.classList.add('celebration__pop');
        medal.style.setProperty('--pop-delay', '1.4s');
      }
      qs('[data-celebration-set-name]', entry).textContent = item.shortName;
      qs('[data-celebration-set-state]', entry).textContent = prayed ? ', rezado hoje' : ', ainda não rezado';
      setIllustration(qs('[data-celebration-set-illustration]', entry), item.illustration);
      return fragment;
    }),
  );

  section.hidden = false;
  createCelebration(section).play();
  centerInView(section);
  section.focus({ preventScroll: true });
}

/**
 * Scrolls so the element sits in the middle of what is visible below the sticky header
 * and trail; when it is taller than that, its top goes just below them.
 */
function centerInView(element) {
  const covered = qsa('.pray-header, .rosary-progress')
    .filter((item) => getComputedStyle(item).position === 'sticky')
    .reduce((sum, item) => sum + item.offsetHeight, 0);
  const visible = window.innerHeight - covered;
  const { top, height } = element.getBoundingClientRect();
  const offset = covered + Math.max((visible - height) / 2, 0);

  window.scrollTo({
    top: window.scrollY + top - offset,
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  });
}

/** "Completar o Rosário": how many terços are left for the Rosary in progress today. */
function renderMoreRosary(root, sets, { completed, prayedIds }) {
  const left = sets.filter((item) => !prayedIds.has(item.id)).length;
  const rosary = completed ? 'mais um Rosário' : 'o Rosário';

  qs('[data-more-rosary]', root).textContent =
    left === 1
      ? `Falta 1 terço hoje para completar ${rosary}.`
      : `Faltam ${left} terços hoje para completar ${rosary}.`;
}

function setIdsOf(sets) {
  return sets.map((item) => item.id);
}

/** @returns {string} Link to one stage of a set's terço. */
function stageUrl(set, stage) {
  return appUrl(`pray.html?mystery=${encodeURIComponent(set.id)}&step=${encodeURIComponent(stage.id)}`);
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

/**
 * Mysteries replace the common intro with the meditation (illustration, quote,
 * reflections and fruit) beside the prayers; the stage list is not shown.
 */
function renderMeditation(root, set, stage) {
  const isMystery = stage.kind === 'mystery';

  qs('[data-meditation]', root).hidden = !isMystery;
  qs('[data-stage-intro]', root).hidden = isMystery;
  qs('[data-stage-aside]', root).hidden = isMystery;
  qs('[data-layout]', root).classList.toggle('pray__layout--mystery', isMystery);
  if (!isMystery) return;

  const { mystery } = stage;

  qs('[data-meditation-eyebrow]', root).textContent = `${stage.trailLabel} Mistério ${set.singular}`;
  qs('[data-meditation-title]', root).textContent = mystery.title;
  qs('[data-meditation-quote]', root).textContent = `“${mystery.quote}”`;
  qs('[data-meditation-reference]', root).textContent = mystery.reference;
  qs('[data-meditation-fruit]', root).textContent = `${mystery.fruit}.`;
  setIllustration(qs('[data-meditation-illustration]', root), mystery.illustration);

  qs('[data-meditation-reflections]', root).replaceChildren(
    ...mystery.reflections.map((reflection) => {
      const item = cloneTemplate('reflection-template');
      qs('[data-reflection-text]', item).textContent = reflection;
      return item;
    }),
  );
}

/** "Voltar" to the previous stage and "A seguir" with the link to the next one. */
function renderNavigation(root, set, stages, stageIndex) {
  const previousStage = stages[stageIndex - 1];
  const nextStage = stages[stageIndex + 1];
  const stage = stages[stageIndex];
  const previous = qs('[data-previous-link]', root);

  qs('[data-next]', root).hidden = !previousStage && !nextStage;

  previous.hidden = !previousStage;
  if (previousStage) {
    previous.href = stageUrl(set, previousStage);
    qs('[data-previous-label]', root).textContent = previousLabel(stage, previousStage);
  }

  for (const part of qsa('[data-next-part]', root)) part.hidden = !nextStage;
  if (!nextStage) return;

  const isMystery = nextStage.kind === 'mystery';

  // Shown, and the link opened, by renderNextLock() once every prayer of the stage is marked
  qs('[data-next-title]', root).dataset.title = isMystery
    ? `${nextStage.trailLabel} Mistério · ${nextStage.title}`
    : nextStage.title;
  qs('[data-next-label]', root).textContent =
    stage.kind === 'opening' ? `Ir para o ${nextStage.name}` : isMystery ? 'Próximo mistério' : nextStage.title;
  qs('[data-next-link]', root).dataset.href = stageUrl(set, nextStage);
  setIllustration(qs('[data-next-illustration]', root), nextStage.illustration);
}

/**
 * The next stage opens only when every prayer of this one is marked ("Rezei todas desta etapa"
 * marks them at once). Until then the link has no href and the bar says how many are left.
 */
function renderNextLock(root, stageDone, left) {
  const link = qs('[data-next-link]', root);
  const title = qs('[data-next-title]', root);
  if (!link.dataset.href) return; // the closing stage ends with "Concluir o terço"

  if (stageDone) {
    link.href = link.dataset.href;
    link.removeAttribute('aria-disabled');
  } else {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
  }
  qs('[data-next-eyebrow]', root).textContent = stageDone ? 'A seguir' : 'Para seguir';
  title.textContent = stageDone
    ? title.dataset.title
    : left === 1
      ? 'Falta 1 oração nesta etapa'
      : `Faltam ${left} orações nesta etapa`;
}

/** "Orações iniciais", "Mistério anterior" or "5º mistério". */
function previousLabel(stage, previousStage) {
  if (previousStage.kind === 'opening') return 'Orações iniciais';
  if (stage.kind === 'mystery') return 'Mistério anterior';
  return previousStage.name;
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
