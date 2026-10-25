import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllProgress,
  clearProgress,
  getProgress,
  hasProgress,
  saveProgress,
} from '../../src/js/services/progress.js';

const TODAY = '2026-10-25';

beforeEach(() => localStorage.clear());

describe('progress', () => {
  it('starts empty', () => {
    expect(getProgress('joyful', TODAY)).toEqual({});
    expect(hasProgress('joyful', TODAY)).toBe(false);
  });

  it('keeps the marks of each set of the day', () => {
    saveProgress('joyful', TODAY, { 'opening/0': 1 });
    saveProgress('glorious', TODAY, { 'opening/0': 1, 'opening/4': 2 });

    expect(getProgress('joyful', TODAY)).toEqual({ 'opening/0': 1 });
    expect(getProgress('glorious', TODAY)).toEqual({ 'opening/0': 1, 'opening/4': 2 });
    expect(hasProgress('glorious', TODAY)).toBe(true);
  });

  it('starts over on a new day', () => {
    saveProgress('joyful', '2026-10-24', { 'opening/0': 1 });

    expect(getProgress('joyful', TODAY)).toEqual({});
    saveProgress('sorrowful', TODAY, { 'opening/0': 1 });
    expect(getProgress('joyful', '2026-10-24')).toEqual({});
  });

  it('does not count steps marked zero times', () => {
    saveProgress('joyful', TODAY, { 'opening/0': 0 });
    expect(hasProgress('joyful', TODAY)).toBe(false);
  });

  it('clears one set and keeps the others', () => {
    saveProgress('joyful', TODAY, { 'opening/0': 1 });
    saveProgress('luminous', TODAY, { 'opening/0': 1 });
    clearProgress('joyful', TODAY);

    expect(getProgress('joyful', TODAY)).toEqual({});
    expect(getProgress('luminous', TODAY)).toEqual({ 'opening/0': 1 });
  });

  it('clears everything', () => {
    saveProgress('joyful', TODAY, { 'opening/0': 1 });
    clearAllProgress();
    expect(localStorage.getItem('santo-terco:progress')).toBeNull();
  });

  it('ignores saved data with an unexpected shape', () => {
    localStorage.setItem('santo-terco:progress', JSON.stringify({ date: TODAY, sets: { joyful: [1, 2] } }));
    expect(getProgress('joyful', TODAY)).toEqual({});
  });
});
