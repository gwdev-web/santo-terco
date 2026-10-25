/**
 * App configuration.
 * The JSON data lives in this repository's /data folder. The production build
 * reads it through its GitHub raw URL, so data updates go live with a push to
 * main, without a new build. In development, Vite serves the local /data files,
 * so changes can be tested before they are pushed.
 * Both URLs are set in vite.config.js, which also preloads each page's data files.
 */
export const DATA_BASE_URL = import.meta.env.DATA_URL;

export const FETCH_TIMEOUT_MS = 10000;

/** Prefix for every localStorage key, so the app never collides with other data. */
export const STORAGE_PREFIX = 'santo-terco:';

/** Mobile range (≤ 640px), where some pages show one group at a time in tabs. */
export const MOBILE_MEDIA_QUERY = '(max-width: 40em)';
