import { qs, qsa } from '../utils/dom.js';

/**
 * Tabs following the WAI-ARIA tabs pattern: `[role="tablist"]` with `[role="tab"]` buttons,
 * each pointing to its panel with `aria-controls`. Arrow keys, Home and End move between
 * tabs, and a tab is selected as soon as it gets focus.
 *
 * With `media`, the tabs only work while that media query matches; otherwise every panel
 * is shown and the tab list is expected to be hidden by CSS (e.g. tabs on mobile only).
 *
 * @param {HTMLElement} root - Element that contains the tab list and the panels.
 * @param {{ media?: string }} [options]
 */
export function initTabs(root, { media } = {}) {
  const tabList = qs('[role="tablist"]', root);
  const tabs = qsa('[role="tab"]', tabList);
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  const query = media ? window.matchMedia(media) : null;
  let selected = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
  );

  function render() {
    const active = !query || query.matches;

    tabs.forEach((tab, index) => {
      const isSelected = index === selected;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      panels[index].hidden = active && !isSelected;

      if (active) panels[index].setAttribute('role', 'tabpanel');
      else panels[index].removeAttribute('role');
    });
  }

  function select(index, { focus = false } = {}) {
    selected = (index + tabs.length) % tabs.length;
    render();
    if (focus) tabs[selected].focus();
  }

  tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));

  tabList.addEventListener('keydown', (event) => {
    const moves = { ArrowRight: selected + 1, ArrowLeft: selected - 1, Home: 0, End: tabs.length - 1 };
    if (!(event.key in moves)) return;

    event.preventDefault();
    select(moves[event.key], { focus: true });
  });

  query?.addEventListener('change', render);
  render();
}
