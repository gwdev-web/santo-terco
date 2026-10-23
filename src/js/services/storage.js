import { STORAGE_PREFIX } from '../config.js';

/**
 * Browser persistence (localStorage). Nothing is sent to a server.
 * Storage can be unavailable (private mode, blocked site data) or full,
 * so every access is guarded and the app keeps working without it.
 */

/**
 * @template T
 * @param {string} key - Key without the app prefix, e.g. "history".
 * @param {T} fallback - Returned when nothing is stored or the value can't be read.
 * @returns {T}
 */
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
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
  } catch {
    return false;
  }
}

/** @param {string} key - Key without the app prefix. */
export function removeItem(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Nothing to remove when storage is unavailable
  }
}
