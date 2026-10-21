import { fetchJson } from './api.js';

/**
 * @typedef {object} Prayer
 * @property {string} id - e.g. "hail-mary".
 * @property {string} title - e.g. "Ave Maria".
 * @property {string} illustration - Illustration name, e.g. "ave-maria".
 * @property {string} when - When it is prayed, e.g. "10 vezes por mistério".
 * @property {string} text - Full text; "\n" separates lines.
 *
 * @typedef {object} PrayerGroup
 * @property {string} id - "opening", "each-mystery" or "closing".
 * @property {string} title
 * @property {string} description
 * @property {Prayer[]} prayers - In the order they are prayed.
 *
 * @typedef {object} LitanyLine
 * @property {string} invocation - Said by whoever leads.
 * @property {string} response - Said by everyone.
 *
 * @typedef {object} Litany
 * @property {string} id
 * @property {string} title
 * @property {string} illustration
 * @property {string} note - e.g. "Também chamada Lauretana".
 * @property {LitanyLine[]} lines
 * @property {string} closingPrayer - The "Oremos" at the end.
 *
 * @typedef {object} PrayerBook
 * @property {PrayerGroup[]} rosaryGroups
 * @property {Prayer[]} complementary
 * @property {Litany[]} litanies
 */

/**
 * @returns {Promise<PrayerBook>}
 * @throws {Error} When the file can't be loaded or has an unexpected shape.
 */
export async function getPrayerBook() {
  const data = await fetchJson('prayers.json');

  if (!Array.isArray(data?.rosaryGroups) || !Array.isArray(data.complementary) || !Array.isArray(data.litanies)) {
    throw new Error('prayers.json is missing "rosaryGroups", "complementary" or "litanies"');
  }

  return data;
}
