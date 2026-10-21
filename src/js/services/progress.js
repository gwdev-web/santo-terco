import { readJson, writeJson } from './storage.js';

const PROGRESS_KEY = 'progress';

/**
 * Progress of the terços started today, saved in the browser so the user can
 * continue where they stopped. Only the current day is kept:
 * `{ date: "YYYY-MM-DD", sets: { [setId]: { [stepKey]: timesMarked } } }`.
 */

const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param {string} setId
 * @param {string} dateKey - "YYYY-MM-DD".
 * @returns {Record<string, number>} How many times each step was marked (see Step.key).
 */
export function getProgress(setId, dateKey) {
  const saved = readJson(PROGRESS_KEY, null);
  const counts = saved?.date === dateKey ? saved.sets?.[setId] : null;

  return isRecord(counts) ? counts : {};
}

/**
 * @param {string} setId
 * @param {string} dateKey
 * @param {Record<string, number>} counts
 */
export function saveProgress(setId, dateKey, counts) {
  const saved = readJson(PROGRESS_KEY, null);
  const sets = saved?.date === dateKey && isRecord(saved.sets) ? saved.sets : {};

  writeJson(PROGRESS_KEY, { date: dateKey, sets: { ...sets, [setId]: counts } });
}

/** @returns {boolean} Whether anything was marked today for this set. */
export function hasProgress(setId, dateKey) {
  return Object.values(getProgress(setId, dateKey)).some((value) => value > 0);
}
