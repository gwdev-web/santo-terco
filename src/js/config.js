/**
 * App configuration.
 * The JSON data lives in this repository's /data folder. The production build
 * reads it through its GitHub raw URL, so data updates go live with a push to
 * main, without a new build. In development, Vite serves the local /data files,
 * so changes can be tested before they are pushed.
 */
const GITHUB_OWNER = 'gwdev-web';
const GITHUB_REPO = 'santo-terco';
const GITHUB_BRANCH = 'main';
const DATA_DIR = 'data';

const RAW_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_DIR}`;

export const DATA_BASE_URL = import.meta.env.DEV ? `/${DATA_DIR}` : RAW_DATA_URL;

export const FETCH_TIMEOUT_MS = 10000;

/** Prefix for every localStorage key, so the app never collides with other data. */
export const STORAGE_PREFIX = 'santo-terco:';

/** Mobile range (≤ 640px), where some pages show one group at a time in tabs. */
export const MOBILE_MEDIA_QUERY = '(max-width: 40em)';
