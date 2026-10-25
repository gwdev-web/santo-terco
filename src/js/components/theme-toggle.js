import { readJson, writeJson } from '../services/storage.js';

/**
 * Light/dark theme switch in the header: one button with `aria-pressed` ("Tema escuro").
 * The theme is set as `data-theme` on <html>, which swaps the color tokens (src/styles/tokens.css).
 * Until the user chooses, the site follows the system preference; the choice is saved in the browser.
 * The theme is applied before the first paint by an inline script in partials/head.html.
 */

const STORAGE_KEY = 'theme';
const THEME_COLORS = { light: '#FAF8F5', dark: '#141C31' };

/** @param {HTMLButtonElement} button */
export function initThemeToggle(button) {
  const root = document.documentElement;
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const apply = (theme) => {
    root.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    themeColor?.setAttribute('content', THEME_COLORS[theme]);
  };

  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    writeJson(STORAGE_KEY, theme);
    apply(theme);
  });

  // Follow the system while the user hasn't chosen a theme
  systemDark.addEventListener('change', (event) => {
    if (readJson(STORAGE_KEY, null) === null) apply(event.matches ? 'dark' : 'light');
  });

  apply(root.dataset.theme === 'dark' ? 'dark' : 'light');
}
