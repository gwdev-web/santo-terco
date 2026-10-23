import { toDateKey } from '../utils/date.js';
import { readJson, writeJson } from './storage.js';

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
 * Saves a finished terço.
 *
 * @param {string} setId
 * @param {Date} date - When it was finished.
 * @returns {boolean} Whether it was saved.
 */
export function addHistoryEntry(setId, date) {
  return writeJson(HISTORY_KEY, [...getHistory(), { setId, date: toDateKey(date), completedAt: date.toISOString() }]);
}

/**
 * Full Rosaries prayed on a day: each one needs the four sets, so it is the
 * number of times the least prayed set was finished that day.
 *
 * @param {string[]} setIds - Ids of the four sets.
 * @param {string} dateKey - "YYYY-MM-DD".
 * @returns {number}
 */
export function countRosariesOn(setIds, dateKey) {
  const entries = getHistory().filter((entry) => entry.date === dateKey);
  return Math.min(...setIds.map((id) => entries.filter((entry) => entry.setId === id).length));
}

/**
 * @param {string} dateKey - "YYYY-MM-DD".
 * @returns {Set<string>} Ids of the sets prayed on that day.
 */
export function getSetIdsPrayedOn(dateKey) {
  return new Set(getHistory().filter((entry) => entry.date === dateKey).map((entry) => entry.setId));
}

/**
 * Consecutive days with at least one terço prayed, ending today
 * (or yesterday, so the streak doesn't look lost before today's prayer).
 *
 * @param {Date} today
 * @returns {number}
 */
export function getStreak(today) {
  const days = new Set(getHistory().map((entry) => entry.date));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  if (!days.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
