import { cloneTemplate, qs } from '../utils/dom.js';

/**
 * Bead counter: one button per Hail Mary, with `aria-pressed`.
 * Tapping a bead marks every bead up to it; tapping the last marked bead unmarks it.
 * The next bead pulses while its step is the current one.
 * Beads are cloned from `#bead-template`.
 *
 * @param {HTMLElement} group - Empty element that receives the beads.
 * @param {object} options
 * @param {string[]} options.labels - Accessible name of each bead, e.g. "1ª Ave Maria, pela Fé".
 * @param {string[]} [options.intentions] - Visible label under each bead, e.g. "Fé".
 * @param {(value: number) => void} options.onChange - Receives how many beads should be marked.
 * @returns {{ update(value: number, isCurrent: boolean): void }}
 */
export function createBeadCounter(group, { labels, intentions = [], onChange }) {
  let current = 0;

  group.style.setProperty('--bead-count', String(labels.length)); // used by the bead ring

  const beads = labels.map((label, index) => {
    const item = cloneTemplate('bead-template');
    const bead = qs('[data-bead]', item);
    const intention = qs('[data-bead-intention]', item);

    qs('.bead-slot', item).style.setProperty('--bead-index', String(index));
    bead.textContent = String(index + 1);
    bead.setAttribute('aria-label', label);
    bead.addEventListener('click', () => onChange(index + 1 === current ? index : index + 1));

    if (intentions[index]) {
      intention.textContent = intentions[index];
      intention.hidden = false;
    }

    group.append(item);
    return bead;
  });

  return {
    update(value, isCurrent) {
      beads.forEach((bead, index) => {
        bead.setAttribute('aria-pressed', String(index < value));
        bead.classList.toggle('bead--next', isCurrent && index === value);
        bead.classList.toggle('bead--pop', value > current && index === value - 1);
      });
      current = value;
    },
  };
}
