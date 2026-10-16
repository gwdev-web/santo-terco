import { DATA_BASE_URL, FETCH_TIMEOUT_MS } from '../config.js';

const cache = new Map();

/**
 * Fetches a JSON file from the data source (GitHub raw).
 * Responses are cached per URL, so each file is requested only once per session.
 *
 * @param {string} fileName - File name relative to DATA_BASE_URL, e.g. "mysteries.json".
 * @returns {Promise<unknown>} Parsed JSON.
 * @throws {Error} On network failure, timeout, non-2xx status or invalid JSON.
 */
export function fetchJson(fileName) {
  const url = `${DATA_BASE_URL}/${fileName.replace(/^\/+/, '')}`;

  if (!cache.has(url)) {
    const request = requestJson(url).catch((error) => {
      cache.delete(url); // allow a retry on the next call
      throw error;
    });
    cache.set(url, request);
  }

  return cache.get(url);
}

async function requestJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timed out loading ${url} after ${FETCH_TIMEOUT_MS}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
