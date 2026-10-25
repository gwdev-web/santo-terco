import { STORAGE_PREFIX } from '../config.js';
import { logWarning } from '../utils/log.js';

/**
 * Browser persistence (localStorage). Nothing is sent to a server.
 * Storage can be unavailable (private mode, blocked site data) or full,
 * so every access is guarded and the app keeps working without it.
 * Failures are logged once per kind, so a blocked storage doesn't flood the console.
 */

const warned = new Set();
let available = null;

function warnOnce(kind, message, error) {
  if (warned.has(kind)) return;
  warned.add(kind);
  logWarning(message, error);
}

/**
 * Whether this browser lets the site save data. Checked once per page with a test write.
 * When it doesn't, the page tells the user that progress and history won't be kept.
 *
 * @returns {boolean}
 */
export function isStorageAvailable() {
  if (available === null) {
    const key = `${STORAGE_PREFIX}test`;
    try {
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      available = true;
    } catch (error) {
      available = false;
      warnOnce('unavailable', 'localStorage is unavailable; progress and history will not be saved', error);
    }
  }

  return available;
}

/**
 * @template T
 * @param {string} key - Key without the app prefix, e.g. "history".
 * @param {T} fallback - Returned when nothing is stored or the value can't be read.
 * @returns {T}
 */
export function readJson(key, fallback) {
  let raw;

  try {
    raw = localStorage.getItem(STORAGE_PREFIX + key);
  } catch (error) {
    warnOnce('unavailable', 'localStorage is unavailable; progress and history will not be saved', error);
    return fallback;
  }

  if (raw === null) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    warnOnce(`invalid:${key}`, `Ignoring the saved value of "${STORAGE_PREFIX + key}": it is not valid JSON`, error);
    return fallback;
  }
}

/**
 * @param {string} key - Key without the app prefix.
 * @param {unknown} value - Any JSON-serializable value.
 * @returns {boolean} Whether the value was saved.
 */
export function writeJson(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    warnOnce(`write:${key}`, `Could not save "${STORAGE_PREFIX + key}" (storage full or blocked)`, error);
    return false;
  }
}

/** @param {string} key - Key without the app prefix. */
export function removeItem(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Nothing to remove when storage is unavailable; readJson already warned about it
  }
}
