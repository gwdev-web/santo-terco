import { qs, qsa } from '../utils/dom.js';

/**
 * Loads a page's data with loading and error states.
 * - While loading, `root` has `aria-busy="true"` (skeletons show through CSS).
 * - On failure, `[data-load-error]` is shown in place of every `[data-load-content]`,
 *   and its `[data-load-retry]` button runs `load` again.
 *
 * @param {HTMLElement} root - Usually the page's <main>.
 * @param {() => Promise<void>} load - Fetches and renders; throws on failure.
 * @param {{ onError?: () => void }} [options] - `onError` renders a fallback for content that stays visible.
 */
export function initDataLoader(root, load, { onError } = {}) {
  const error = qs('[data-load-error]', root);
  const retry = qs('[data-load-retry]', root);

  async function run() {
    root.setAttribute('aria-busy', 'true');
    retry.disabled = true;

    try {
      await load();
      showError(false);
    } catch (loadError) {
      console.error(loadError);
      onError?.();
      showError(true);
    } finally {
      root.setAttribute('aria-busy', 'false');
      retry.disabled = false;
    }
  }

  function showError(failed) {
    error.hidden = !failed;
    for (const content of qsa('[data-load-content]', root)) content.hidden = failed;
  }

  retry.addEventListener('click', run);
  run();
}
