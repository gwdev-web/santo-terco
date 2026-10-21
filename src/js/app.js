import { qsa } from './utils/dom.js';

/**
 * Shared behavior for every page.
 * Keep this small: page-specific logic lives in src/js/pages/.
 */
export function initApp() {
  for (const year of qsa('[data-current-year]')) {
    year.textContent = String(new Date().getFullYear());
  }
}
