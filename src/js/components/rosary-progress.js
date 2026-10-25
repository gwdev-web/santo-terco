import { cloneTemplate, qs } from '../utils/dom.js';
import { setIllustration } from './illustration.js';

/**
 * "Sua caminhada de hoje": prayers marked out of 71, a progress bar, the day's streak
 * and the trail of seven medals (Início, 1º–5º, Final). Medals are cloned from
 * `#trail-medal-template`; a medal that is earned during the visit plays the unlock animation.
 *
 * @param {HTMLElement} root - Element with the `[data-progress-*]`, `[data-streak*]` and `[data-trail]` slots.
 * @param {import('../services/rosary.js').Stage[]} stages
 * @param {number} currentIndex - Stage being prayed.
 * @returns {{ update(state: { marked: number, total: number, stagesDone: boolean[], streak: number }): void }}
 */
export function createRosaryProgress(root, stages, currentIndex) {
  const trail = qs('[data-trail]', root);
  const bar = qs('[data-progress-bar]', root);
  let previousDone = null;

  const steps = stages.map((stage, index) => {
    const item = cloneTemplate('trail-medal-template');
    const step = qs('[data-trail-step]', item);

    qs('[data-trail-label]', item).textContent = stage.trailLabel;
    qs('[data-trail-name]', item).textContent = stage.name;
    setIllustration(qs('[data-trail-illustration]', item), stage.illustration);
    if (index === currentIndex) step.setAttribute('aria-current', 'step');

    trail.append(item);
    return step;
  });

  return {
    update({ marked, total, stagesDone, streak }) {
      const percent = total ? Math.round((marked / total) * 100) : 0;

      qs('[data-progress-count]', root).textContent = `${marked} de ${total} orações`;
      qs('[data-progress-percent]', root).textContent = `${percent}%`;
      bar.style.setProperty('--progress', `${percent}%`);

      qs('[data-streak]', root).hidden = streak < 2;
      qs('[data-streak-label]', root).textContent = `${streak} dias seguidos`;

      steps.forEach((step, index) => {
        const done = stagesDone[index];
        const medal = qs('[data-trail-medal]', step);

        step.classList.toggle('trail__step--done', done);
        medal.classList.toggle('medal--done', done);
        medal.classList.toggle('medal--current', !done && index === currentIndex);
        medal.classList.toggle('medal--unlock', Boolean(previousDone && done && !previousDone[index]));
        qs('[data-trail-state]', step).textContent = done
          ? ', concluída'
          : index === currentIndex
            ? ', etapa atual'
            : '';
      });

      // The gold line reaches the stage after the last one completed
      const reached = Math.min(stagesDone.lastIndexOf(true) + 1, stages.length - 1);
      trail.style.setProperty('--trail-progress', String(reached / (stages.length - 1)));

      previousDone = stagesDone;
    },
  };
}
