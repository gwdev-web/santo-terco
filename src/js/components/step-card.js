import { cloneTemplate, qs } from '../utils/dom.js';
import { createBeadCounter } from './bead-counter.js';
import { initDisclosure } from './disclosure.js';
import { setIllustration } from './illustration.js';

/**
 * One prayer step of the guided terço, cloned from `#step-card-template`:
 * title, the full text and either a "Rezei" toggle (one prayer) or a bead counter
 * (several Hail Marys). Marking is always optional.
 *
 * A decade (more than 5 beads) also gets a hint, a "Rezei a Nª Ave Maria" button
 * (the center of the bead ring on mobile) and a "Dezena completa!" status.
 *
 * States set by `update()`:
 * - current: gold border and halo, `aria-current="step"`;
 * - done: green border, the text folds away with "Mostrar o texto da oração";
 * - upcoming: neutral.
 *
 * @param {import('../services/rosary.js').Step} step
 * @param {{ number: number, onChange: (value: number) => void }} options
 * @returns {{ element: HTMLElement, update(value: number, state: 'current' | 'done' | 'upcoming'): void }}
 */
export function createStepCard(step, { number, onChange }) {
  const item = cloneTemplate('step-card-template');
  const card = qs('[data-step]', item);
  const toggle = qs('[data-step-toggle]', item);
  const show = qs('[data-step-show]', item);
  const counter = qs('[data-step-counter]', item);
  const body = qs('[data-step-body]', item);
  const add = qs('[data-step-add]', item);
  const status = qs('[data-step-status]', item);
  const bodyId = `step-${step.key.replace(/[^a-z0-9]+/gi, '-')}-text`;
  const isDecade = step.count > 5;
  let value = 0;
  let beads = null;

  qs('[data-step-number]', item).textContent = String(number);
  qs('[data-step-title]', item).textContent = step.title;
  qs('[data-step-subtitle]', item).textContent = step.subtitle;
  setIllustration(qs('[data-step-illustration]', item), step.prayer.illustration);

  qs('[data-step-texts]', item).replaceChildren(
    ...[step.prayer, ...step.also].map((prayer) => {
      const text = document.createElement('p');
      text.className = 'prayer-text prayer-text--boxed';
      text.textContent = prayer.text;
      return text;
    }),
  );

  body.id = bodyId;
  show.setAttribute('aria-controls', bodyId);
  initDisclosure(show);

  if (step.count > 1) {
    const group = qs('[data-step-beads]', item);
    group.hidden = false;
    group.classList.toggle('step-card__beads--decade', step.count > 5);
    group.setAttribute('aria-label', step.title);
    counter.hidden = false;
    qs('[data-counter-total]', item).textContent = String(step.count);
    toggle.remove();

    if (isDecade) {
      qs('[data-step-hint]', item).hidden = false;
      qs('[data-add-total]', item).textContent = String(step.count);
      add.hidden = false;
      status.hidden = false;
      add.addEventListener('click', () => onChange(Math.min(value + 1, step.count)));
    }

    beads = createBeadCounter(group, {
      labels: Array.from({ length: step.count }, (_, index) => {
        const intention = step.intentions[index];
        return `${index + 1}ª Ave Maria${intention ? `, pela ${intention}` : ''}`;
      }),
      intentions: step.intentions,
      onChange,
    });

    if (isDecade) group.append(add, status); // after the beads, in reading and focus order
  } else {
    qs('[data-toggle-context]', item).textContent = `: ${step.title}`;
    toggle.addEventListener('click', () => onChange(value >= 1 ? 0 : 1));
  }

  if (!isDecade) {
    add.remove();
    status.remove();
  }

  return {
    element: card,
    update(nextValue, state) {
      value = nextValue;

      card.classList.toggle('step-card--current', state === 'current');
      card.classList.toggle('step-card--done', state === 'done');
      if (state === 'current') card.setAttribute('aria-current', 'step');
      else card.removeAttribute('aria-current');

      show.hidden = state !== 'done';
      if (beads) {
        qs('[data-counter-value]', card).textContent = String(value);
        beads.update(value, state === 'current');
        if (isDecade) updateDecade();
      } else {
        toggle.setAttribute('aria-pressed', String(value >= 1));
      }
    },
  };

  /** "Rezei a Nª Ave Maria" while beads are left; "Dezena completa!" once all are prayed. */
  function updateDecade() {
    const complete = value >= step.count;

    add.hidden = complete;
    qs('[data-add-count]', card).textContent = String(value);
    qs('[data-add-next]', card).textContent = `${Math.min(value + 1, step.count)}ª`;

    if (!complete) status.replaceChildren();
    else if (!status.childElementCount) status.replaceChildren(cloneTemplate('decade-complete-template'));
  }
}
