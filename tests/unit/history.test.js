import { beforeEach, describe, expect, it } from 'vitest';
import {
  addHistoryEntry,
  clearHistory,
  countRosaries,
  countRosariesOn,
  getHistory,
  getLongestStreak,
  getSetIdsPrayedOn,
  getStreak,
} from '../../src/js/services/history.js';
import { localDate } from './helpers.js';

const SET_IDS = ['joyful', 'sorrowful', 'glorious', 'luminous'];

/** Saves one terço of `setId` on each "YYYY-MM-DD" day. */
const prayOn = (setId, ...dateKeys) => {
  for (const key of dateKeys) {
    const [year, month, day] = key.split('-').map(Number);
    addHistoryEntry(setId, new Date(year, month - 1, day, 20));
  }
};

beforeEach(() => localStorage.clear());

describe('history', () => {
  it('saves finished terços oldest first', () => {
    prayOn('joyful', '2026-10-24');
    prayOn('glorious', '2026-10-25');

    expect(getHistory().map(({ setId, date }) => [setId, date])).toEqual([
      ['joyful', '2026-10-24'],
      ['glorious', '2026-10-25'],
    ]);
  });

  it('skips entries that cannot be read', () => {
    localStorage.setItem(
      'santo-terco:history',
      JSON.stringify([{ setId: 'joyful', date: '2026-10-25' }, { setId: 'joyful', date: '25/10/2026' }, null, 'x']),
    );
    expect(getHistory()).toHaveLength(1);
  });

  it('clears everything', () => {
    prayOn('joyful', '2026-10-25');
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('lists the sets prayed on a day', () => {
    prayOn('joyful', '2026-10-25', '2026-10-25');
    prayOn('luminous', '2026-10-25');
    prayOn('glorious', '2026-10-24');

    expect(getSetIdsPrayedOn('2026-10-25')).toEqual(new Set(['joyful', 'luminous']));
  });
});

describe('Rosaries', () => {
  it('needs all four sets on the same day', () => {
    prayOn('joyful', '2026-10-25');
    prayOn('sorrowful', '2026-10-25');
    prayOn('glorious', '2026-10-25');
    expect(countRosariesOn(SET_IDS, '2026-10-25')).toBe(0);

    prayOn('luminous', '2026-10-25');
    expect(countRosariesOn(SET_IDS, '2026-10-25')).toBe(1);
  });

  it('does not mix days', () => {
    prayOn('joyful', '2026-10-25');
    prayOn('sorrowful', '2026-10-25');
    prayOn('glorious', '2026-10-25');
    prayOn('luminous', '2026-10-24');
    expect(countRosariesOn(SET_IDS, '2026-10-25')).toBe(0);
  });

  it('counts the least prayed set', () => {
    const day = SET_IDS.flatMap((setId) => [{ setId }, { setId }]).slice(0, -1);
    expect(countRosaries(day, SET_IDS)).toBe(1);
    expect(countRosaries([...day, { setId: 'luminous' }], SET_IDS)).toBe(2);
  });
});

describe('streaks', () => {
  const TODAY = localDate(2026, 10, 25);

  it('is zero without prayers', () => {
    expect(getStreak(TODAY)).toBe(0);
    expect(getLongestStreak()).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    prayOn('joyful', '2026-10-23', '2026-10-24', '2026-10-25');
    expect(getStreak(TODAY)).toBe(3);
  });

  it('is not lost before today’s prayer', () => {
    prayOn('joyful', '2026-10-23', '2026-10-24');
    expect(getStreak(TODAY)).toBe(2);
  });

  it('breaks after a day without prayer', () => {
    prayOn('joyful', '2026-10-20', '2026-10-21', '2026-10-23');
    expect(getStreak(TODAY)).toBe(0);
  });

  it('counts several terços on the same day once', () => {
    prayOn('joyful', '2026-10-25', '2026-10-25');
    prayOn('luminous', '2026-10-25');
    expect(getStreak(TODAY)).toBe(1);
  });

  it('finds the longest run, across months and years', () => {
    prayOn('joyful', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02');
    prayOn('joyful', '2026-10-01', '2026-10-02');
    prayOn('joyful', '2027-01-05');
    expect(getLongestStreak()).toBe(4);
  });
});
