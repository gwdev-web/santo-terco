/**
 * Show/hide toggle: a `.disclosure__toggle` button with `aria-expanded` and `aria-controls`.
 * The panel opens and closes through CSS (see components/disclosure.css), which reads
 * `aria-expanded`, so this only flips the state.
 *
 * @param {HTMLButtonElement} button
 */
export function initDisclosure(button) {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
  });
}
