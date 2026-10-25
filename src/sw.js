/**
 * Service worker: the site opens and works without internet, and repeat visits load from the device.
 * The build fills the manifest below (see serviceWorker() in vite.config.js), so every deploy is a new
 * version. Paths are relative to this file, which sits at the root of the site.
 *
 * - Pages and assets: from the cache first (they only change with a new version).
 * - Data (GitHub raw): from the cache right away, refreshed in the background for the next visit.
 * - On install, the shell (pages, CSS, JS, fonts, icons) is required; the illustrations are
 *   cached too, but a failure there doesn't stop the install. Hashed files already cached by the
 *   previous version are copied instead of downloaded again.
 */

const { version, core, extra, dataUrl, dataFiles } = __SW_MANIFEST__;

const CACHE_PREFIX = 'santo-terco-';
const PAGES_CACHE = `${CACHE_PREFIX}${version}`;
const DATA_CACHE = `${CACHE_PREFIX}data`;
const scope = new URL(self.registration.scope);

/**
 * Scripts and fonts are requested with an Origin header and stored without one; the server answers
 * with "Vary: Origin", so a plain match would miss them. Every cached file is the site's own (or the
 * public data), the same for any origin.
 */
const MATCH = { ignoreVary: true };

/** Hashed build files never change content under the same name. */
const isHashed = (path) => path.startsWith('assets/');

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);
      await Promise.all(core.map((path) => addToCache(cache, path)));
      await Promise.allSettled([...extra.map((path) => addToCache(cache, path)), ...dataFiles.map(addData)]);
      // A new version takes over right away: pages are complete documents, so the open one keeps working
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== PAGES_CACHE && name !== DATA_CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.url.startsWith(dataUrl)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(servePage(url));
    return;
  }

  event.respondWith(serveAsset(request, url));
});

/** Copies a hashed file from an older version's cache, or downloads it. */
async function addToCache(cache, path) {
  if (isHashed(path)) {
    const cached = await caches.match(path, MATCH);
    if (cached) return cache.put(path, cached);
  }

  // `no-cache`: past the browser's HTTP cache, so pages of the new version never mix with the old one
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return cache.put(path, response);
}

/** Keeps a data file for offline use, unless a copy is already cached (it is refreshed on use). */
async function addData(fileName) {
  const cache = await caches.open(DATA_CACHE);
  const url = `${dataUrl}${fileName}`;
  if (await cache.match(url, MATCH)) return;

  const response = await fetch(url);
  if (response.ok) await cache.put(url, response);
}

/** Pages ignore the query string (pray.html?mystery=…), and "/" is index.html. */
async function servePage(url) {
  const path = url.pathname.slice(scope.pathname.length).replace(/(^|\/)$/, '$1index.html');
  const cache = await caches.open(PAGES_CACHE);
  const cached = core.includes(path) ? await cache.match(path, MATCH) : undefined;
  if (cached) return cached;

  try {
    return await fetch(url);
  } catch (error) {
    return (await cache.match('404.html', MATCH)) ?? Promise.reject(error);
  }
}

async function serveAsset(request, url) {
  const cached = await caches.match(request, MATCH);
  if (cached) return cached;

  const response = await fetch(request);
  const path = url.pathname.slice(scope.pathname.length);
  if (response.ok && isHashed(path)) {
    const cache = await caches.open(PAGES_CACHE);
    await cache.put(path, response.clone());
  }
  return response;
}

/** Answers from the cache when it can and refreshes it; without a cached copy, waits for the network. */
async function staleWhileRevalidate(event) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(event.request.url, MATCH);
  const refresh = fetch(event.request).then(async (response) => {
    if (response.ok) await cache.put(event.request.url, response.clone());
    return response;
  });

  if (!cached) return refresh;
  event.waitUntil(refresh.catch(() => {})); // offline: the cached copy is enough
  return cached;
}
