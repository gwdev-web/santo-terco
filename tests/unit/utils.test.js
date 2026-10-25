import { describe, expect, it } from 'vitest';
import { formatShortDate, getWeek, toDateKey, weekdayName, weekdayShortName } from '../../src/js/utils/date.js';
import { joinNames } from '../../src/js/utils/text.js';
import { localDate } from './helpers.js';

describe('date', () => {
  it('builds the local day key with zero padding', () => {
    expect(toDateKey(localDate(2026, 1, 5))).toBe('2026-01-05');
    expect(toDateKey(localDate(2026, 12, 31))).toBe('2026-12-31');
  });

  it('uses the local day, not UTC, late at night', () => {
    expect(toDateKey(new Date(2026, 9, 25, 23, 59))).toBe('2026-10-25');
  });

  it('names weekdays and short dates in Portuguese', () => {
    const sunday = localDate(2026, 10, 25);
    expect(weekdayName(sunday)).toBe('Domingo');
    expect(weekdayShortName(sunday)).toBe('Dom');
    expect(formatShortDate(sunday)).toBe('25 out');
  });

  it('returns the week from Monday to Sunday', () => {
    const keys = (date) => getWeek(date).map(toDateKey);
    const week = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];

    expect(keys(localDate(2026, 10, 19))).toEqual(week); // Monday
    expect(keys(localDate(2026, 10, 25))).toEqual(week); // Sunday belongs to the week before it
  });

  it('crosses month and year boundaries', () => {
    expect(getWeek(localDate(2027, 1, 1)).map(toDateKey)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('joinNames', () => {
  it('joins names the Portuguese way', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['Gozosos'])).toBe('Gozosos');
    expect(joinNames(['Gozosos', 'Dolorosos'])).toBe('Gozosos e Dolorosos');
    expect(joinNames(['Gozosos', 'Dolorosos', 'Gloriosos'])).toBe('Gozosos, Dolorosos e Gloriosos');
  });
});
