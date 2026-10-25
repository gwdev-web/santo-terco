import { qs, qsa } from '../utils/dom.js';
import { logError } from '../utils/log.js';

/**
 * Loads a page's data with loading and error states.
 * - While loading, `root` has `aria-busy="true"` (skeletons show through CSS).
 * - On failure, `[data-load-error]` is shown in place of every `[data-load-content]`,
 *   and its `[data-load-retry]` button runs `load` again. It also runs again on its own
 *   when the device comes back online.
 *
 * @param {HTMLElement} root - Usually the page's <main>.
 * @param {() => Promise<void>} load - Fetches and renders; throws on failure.
 * @param {{ onError?: () => void }} [options] - `onError` renders a fallback for content that stays visible.
 */
export function initDataLoader(root, load, { onError } = {}) {
  const error = qs('[data-load-error]', root);
  const retry = qs('[data-load-retry]', root);
  let failed = false;

  async function run() {
    root.setAttribute('aria-busy', 'true');
    retry.disabled = true;

    try {
      await load();
      failed = false;
    } catch (loadError) {
      logError(`Could not load the data of ${document.title}`, loadError);
      failed = true;
      onError?.();
    } finally {
      root.setAttribute('aria-busy', 'false');
      retry.disabled = false;
      error.hidden = !failed;
      for (const content of qsa('[data-load-content]', root)) content.hidden = failed;
    }
  }

  retry.addEventListener('click', run);
  window.addEventListener('online', () => {
    if (failed && !retry.disabled) run(); // not while a retry is already running
  });
  run();
}
