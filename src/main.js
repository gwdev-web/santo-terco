import './styles/main.css';
import { qs } from './js/utils/dom.js';

function init() {
  const year = qs('[data-current-year]');

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
