import { readJson } from './storage.js';

const HISTORY_KEY = 'history';

/**
 * A finished terço, saved when the user completes the closing prayers.
 *
 * @typedef {object} HistoryEntry
 * @property {string} setId - Mystery set id, e.g. "luminous".
 * @property {string} date - Local day it was prayed, "YYYY-MM-DD".
 * @property {string} completedAt - ISO timestamp.
 */

/** @returns {HistoryEntry[]} */
export function getHistory() {
  const entries = readJson(HISTORY_KEY, []);
  return Array.isArray(entries) ? entries : [];
}

/**
 * @param {string} dateKey - "YYYY-MM-DD".
 * @returns {Set<string>} Ids of the sets prayed on that day.
 */
export function getSetIdsPrayedOn(dateKey) {
  return new Set(getHistory().filter((entry) => entry.date === dateKey).map((entry) => entry.setId));
}
