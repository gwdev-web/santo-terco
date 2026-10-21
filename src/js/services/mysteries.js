import { fetchJson } from './api.js';

/**
 * @typedef {object} Mystery
 * @property {string} title - Full title, e.g. "A Anunciação do Anjo a Maria".
 * @property {string} shortTitle - Title for lists, e.g. "Anunciação do Anjo a Maria".
 * @property {string} illustration - Illustration name, e.g. "m-anunciacao".
 * @property {string} reference - Bible reference, e.g. "Lc 1,26-38".
 * @property {string} quote
 * @property {string[]} reflections
 * @property {string} fruit - Fruit of the mystery, lowercase, without a final period.
 *
 * @typedef {object} MysterySet
 * @property {string} id - "joyful", "sorrowful", "glorious" or "luminous".
 * @property {string} name - e.g. "Mistérios Gozosos".
 * @property {string} shortName - e.g. "Gozosos".
 * @property {string} singular - e.g. "Gozoso".
 * @property {number[]} weekdays - Days it is prayed, 0 = Sunday … 6 = Saturday.
 * @property {string} weekdaysLabel - e.g. "Segunda e sábado".
 * @property {string} summary - One sentence about the set.
 * @property {string} illustration - Illustration name, e.g. "gozosos".
 * @property {Mystery[]} mysteries - The five mysteries, in order.
 */

/**
 * @returns {Promise<MysterySet[]>}
 * @throws {Error} When the file can't be loaded or has an unexpected shape.
 */
export async function getMysterySets() {
  const data = await fetchJson('mysteries.json');

  if (!Array.isArray(data?.sets) || data.sets.length === 0) {
    throw new Error('mysteries.json has no "sets" list');
  }

  return data.sets;
}

/**
 * The set the Church suggests for a given day.
 *
 * @param {MysterySet[]} sets
 * @param {Date} date
 * @returns {MysterySet}
 */
export function getSetForDate(sets, date) {
  return sets.find((set) => set.weekdays.includes(date.getDay())) ?? sets[0];
}
