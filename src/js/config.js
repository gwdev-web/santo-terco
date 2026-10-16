/**
 * App configuration.
 * The JSON data lives in this repository's /data folder and is read
 * through its GitHub raw URL, so data updates go live with a push to main,
 * without a new build.
 */
const GITHUB_OWNER = 'gwdev-web';
const GITHUB_REPO = 'santo-terco';
const GITHUB_BRANCH = 'main';
const DATA_DIR = 'data';

export const DATA_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${DATA_DIR}`;

export const FETCH_TIMEOUT_MS = 10000;
