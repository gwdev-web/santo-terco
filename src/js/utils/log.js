/**
 * Messages for developers in the browser console, with a prefix that makes them easy to filter.
 * The user always gets feedback in the page; the console explains what went wrong and where.
 * Warnings are for problems the app works around; errors are for what the user sees fail.
 */

const PREFIX = '[Santo Terço]';

/** @param {string} message @param {unknown} [detail] - Usually the caught error. */
export function logError(message, detail) {
  console.error(PREFIX, message, ...(detail === undefined ? [] : [detail]));
}

/** @param {string} message @param {unknown} [detail] */
export function logWarning(message, detail) {
  console.warn(PREFIX, message, ...(detail === undefined ? [] : [detail]));
}
