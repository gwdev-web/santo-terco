import { initServiceWorker } from './components/service-worker.js';
import { initStorageNotice } from './components/storage-notice.js';
import { initThemeToggle } from './components/theme-toggle.js';
import { qs, qsa } from './utils/dom.js';

/**
 * Shared behavior for every page.
 * Keep this small: page-specific logic lives in src/js/pages/.
 */
export function initApp() {
  for (const year of qsa('[data-current-year]')) {
    year.textContent = String(new Date().getFullYear());
  }

  const themeToggle = qs('[data-theme-toggle]');
  if (themeToggle) initThemeToggle(themeToggle);

  initStorageNotice();
  initServiceWorker();
}
