/**
 * Small text helpers for UI copy in Portuguese.
 */

/** @param {string[]} names @returns {string} "a", "a e b", "a, b e c". */
export function joinNames(names) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names.at(-1)}` : names.join('');
}
