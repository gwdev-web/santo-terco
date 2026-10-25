import { cloneTemplate, qs } from '../utils/dom.js';
import { setIllustration } from './illustration.js';

const DURATION = 6000;

/**
 * Toast: a short notification at the top right (top on mobile) for a medal just earned,
 * cloned from `#toast-template` into `[data-toast-region]`. It closes by itself after
 * a few seconds, waits while the pointer or focus is on it, and has a close button.
 * Only one shows at a time. It is not announced: the same message is already
 * in the page, in a `role="status"` region.
 *
 * @param {{ title: string, text: string, illustration: string }} message
 */
export function showToast({ title, text, illustration }) {
  const region = qs('[data-toast-region]');
  if (!region) return;

  const fragment = cloneTemplate('toast-template');
  const toast = qs('[data-toast]', fragment);
  let remaining = DURATION;
  let startedAt = 0;
  let timer = 0;

  qs('[data-toast-title]', toast).textContent = title;
  qs('[data-toast-text]', toast).textContent = text;
  setIllustration(qs('[data-toast-illustration]', toast), illustration);
  toast.style.setProperty('--toast-duration', `${DURATION}ms`);

  function start() {
    startedAt = Date.now();
    timer = window.setTimeout(close, remaining);
  }

  function pause() {
    window.clearTimeout(timer);
    remaining = Math.max(remaining - (Date.now() - startedAt), 0);
  }

  function close() {
    window.clearTimeout(timer);
    toast.classList.add('toast--leaving');
    toast.addEventListener('animationend', (event) => {
      if (event.target === toast) toast.remove();
    });
  }

  qs('[data-toast-close]', toast).addEventListener('click', close);
  toast.addEventListener('pointerenter', pause);
  toast.addEventListener('pointerleave', start);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('focusout', (event) => {
    if (!toast.contains(event.relatedTarget)) start();
  });

  region.replaceChildren(fragment);
  start();
}
