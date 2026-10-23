import { writeJson } from '../services/storage.js';
import { qsa } from '../utils/dom.js';

/**
 * Prayer text size control: three "A" buttons with `aria-pressed`.
 * The choice is saved in the browser and applied as `data-text-size` on <html>,
 * which scales `--text-prayer` and `--text-litany` on every page.
 * The saved size is applied before the first paint by an inline script in partials/head.html.
 */

const STORAGE_KEY = 'text-size';

/** @param {HTMLElement} group - Element with the `[data-size-option]` buttons. */
export function initTextSize(group) {
  const buttons = qsa('[data-size-option]', group);
  const current = document.documentElement.dataset.textSize ?? 'normal';

  const render = (size) => {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.sizeOption === size));
  };

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const size = button.dataset.sizeOption;

      if (size === 'normal') delete document.documentElement.dataset.textSize;
      else document.documentElement.dataset.textSize = size;

      writeJson(STORAGE_KEY, size);
      render(size);
    });
  }

  render(current);
}
