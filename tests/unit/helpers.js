import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Reads a file of the repository's /data folder, as the site would fetch it.
 *
 * @param {string} fileName - e.g. "mysteries.json".
 */
export const readData = (fileName) =>
  JSON.parse(readFileSync(resolve(import.meta.dirname, '../../data', fileName), 'utf8'));

/** A local date (no time zone surprises): `localDate(2026, 10, 25)` is 25 Oct 2026. */
export const localDate = (year, month, day) => new Date(year, month - 1, day);
