import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FETCH_TIMEOUT_MS } from '../../src/js/config.js';

// api.js caches responses per URL, so each test loads a fresh copy
let fetchJson;

beforeEach(async () => {
  vi.resetModules();
  ({ fetchJson } = await import('../../src/js/services/api.js'));
});

const respondWith = (body, status = 200) =>
  vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));

describe('fetchJson', () => {
  it('loads and parses a data file', async () => {
    const fetch = respondWith({ sets: [] });
    vi.stubGlobal('fetch', fetch);

    await expect(fetchJson('mysteries.json')).resolves.toEqual({ sets: [] });
    expect(fetch).toHaveBeenCalledWith('/data/mysteries.json', expect.objectContaining({ signal: expect.any(Object) }));
  });

  it('requests each file only once', async () => {
    const fetch = respondWith({});
    vi.stubGlobal('fetch', fetch);

    await Promise.all([fetchJson('prayers.json'), fetchJson('prayers.json')]);
    await fetchJson('/prayers.json');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('names the URL and the status of a failed response', async () => {
    vi.stubGlobal('fetch', respondWith('Not found', 404));
    await expect(fetchJson('rosary.json')).rejects.toThrow('Failed to load /data/rosary.json: HTTP 404');
  });

  it('rejects a file that is not valid JSON', async () => {
    vi.stubGlobal('fetch', respondWith('<html>'));
    await expect(fetchJson('rosary.json')).rejects.toThrow('/data/rosary.json is not valid JSON');
  });

  it('tries again after a failure ("Tentar de novo")', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetch);

    await expect(fetchJson('rosary.json')).rejects.toThrow('network or CORS error');
    await expect(fetchJson('rosary.json')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('explains a failure when the device is offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await expect(fetchJson('rosary.json')).rejects.toThrow('the device is offline');
  });

  it('gives up after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }),
      ),
    );

    const request = fetchJson('rosary.json');
    const assertion = expect(request).rejects.toThrow(
      `Timed out loading /data/rosary.json after ${FETCH_TIMEOUT_MS}ms`,
    );
    await vi.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();
  });
});
