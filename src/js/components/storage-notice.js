import { isStorageAvailable } from '../services/storage.js';
import { qs } from '../utils/dom.js';

/**
 * Calm notice on the pages that save or read progress and history (`[data-storage-notice]`),
 * shown when this browser doesn't keep the site's data: a private window, blocked site data
 * or full storage. Praying still works; only the marks and the history are not kept.
 */

/** Shows the notice at load when storage is unavailable. Pages without the notice skip the check. */
export function initStorageNotice() {
  if (qs('[data-storage-notice]') && !isStorageAvailable()) showStorageNotice();
}

/** Shows the notice, e.g. after a save fails because the storage is full. */
export function showStorageNotice() {
  const notice = qs('[data-storage-notice]');
  if (notice) notice.hidden = false;
}
