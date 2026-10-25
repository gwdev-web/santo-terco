import { beforeEach, describe, expect, it, vi } from 'vitest';

// storage.js remembers availability and warnings per page, so each test loads a fresh copy
let storage;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  storage = await import('../../src/js/services/storage.js');
});

/** Storage as in a private window or with site data blocked: every access throws. */
const blockStorage = () => {
  const blocked = () => {
    throw new DOMException('Blocked', 'SecurityError');
  };
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
};

describe('storage', () => {
  it('saves JSON under the santo-terco: prefix', () => {
    expect(storage.writeJson('theme', 'dark')).toBe(true);
    expect(localStorage.getItem('santo-terco:theme')).toBe('"dark"');
    expect(storage.readJson('theme', 'light')).toBe('dark');
  });

  it('returns the fallback when nothing is saved', () => {
    expect(storage.readJson('history', [])).toEqual([]);
  });

  it('ignores a value that is not valid JSON, warning only once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('santo-terco:history', '{broken');

    expect(storage.readJson('history', [])).toEqual([]);
    expect(storage.readJson('history', [])).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]).toContain('[Santo Terço]');
  });

  it('removes a saved value', () => {
    storage.writeJson('progress', { date: '2026-10-25' });
    storage.removeItem('progress');
    expect(localStorage.getItem('santo-terco:progress')).toBeNull();
  });

  it('reports blocked or full storage instead of throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    blockStorage();

    expect(storage.isStorageAvailable()).toBe(false);
    expect(storage.writeJson('history', [])).toBe(false);
    expect(storage.readJson('history', [])).toEqual([]);
    expect(() => storage.removeItem('history')).not.toThrow();
  });

  it('detects available storage', () => {
    expect(storage.isStorageAvailable()).toBe(true);
  });
});
