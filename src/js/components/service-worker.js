import { logWarning } from '../utils/log.js';
import { appUrl } from '../utils/url.js';

/**
 * Registers the service worker (src/sw.js), which keeps the site working offline.
 * Only in the production build, and only once the page has loaded and the browser is idle,
 * so its downloads never compete with the first visit.
 * The installed app also asks to keep its data, so the browser doesn't clear the history on its own.
 */
export function initServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const register = () =>
    navigator.serviceWorker.register(appUrl('sw.js')).catch((error) => {
      logWarning('Could not register the service worker; the site will not work offline', error);
    });
  const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(register) : setTimeout(register, 1000));

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });

  if (window.matchMedia('(display-mode: standalone)').matches) navigator.storage?.persist?.();
}
