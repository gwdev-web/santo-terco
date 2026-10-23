/**
 * Links built in JavaScript. The site is published under a base path
 * (e.g. "/santo-terco/" on GitHub Pages; "/" in development), set in vite.config.js.
 */

/** @param {string} path - Path inside the site, without a leading slash, e.g. "pray.html". */
export const appUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
