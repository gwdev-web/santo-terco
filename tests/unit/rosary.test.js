import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getMysterySets, getSetForDate } from '../../src/js/services/mysteries.js';
import { getPrayerBook, getPrayersById } from '../../src/js/services/prayers.js';
import { buildStages, countPrayers, getRosary, isStageDone, isStepDone } from '../../src/js/services/rosary.js';
import { localDate, readData } from './helpers.js';

// The services read the repository's /data files, as the site does
vi.mock('../../src/js/services/api.js', () => ({ fetchJson: async (fileName) => readData(fileName) }));

let sets;
let prayersById;
let rosary;

beforeAll(async () => {
  sets = await getMysterySets();
  prayersById = getPrayersById(await getPrayerBook());
  rosary = await getRosary();
});

describe('mystery of the day', () => {
  // 25 Oct 2026 is a Sunday
  it.each([
    [localDate(2026, 10, 25), 'glorious'], // Sunday
    [localDate(2026, 10, 26), 'joyful'], // Monday
    [localDate(2026, 10, 27), 'sorrowful'], // Tuesday
    [localDate(2026, 10, 28), 'glorious'], // Wednesday
    [localDate(2026, 10, 29), 'luminous'], // Thursday
    [localDate(2026, 10, 30), 'sorrowful'], // Friday
    [localDate(2026, 10, 31), 'joyful'], // Saturday
  ])('on %s is %s', (date, setId) => {
    expect(getSetForDate(sets, date).id).toBe(setId);
  });

  it('falls back to the first set when no set lists the day', () => {
    expect(getSetForDate([{ id: 'a', weekdays: [] }], localDate(2026, 10, 25)).id).toBe('a');
  });
});

describe('stages of the terço', () => {
  it.each(['joyful', 'sorrowful', 'glorious', 'luminous'])('builds the seven stages of the %s mysteries', (setId) => {
    const set = sets.find((item) => item.id === setId);
    const stages = buildStages(rosary, set, prayersById);

    expect(stages.map((stage) => stage.id)).toEqual(['opening', '1', '2', '3', '4', '5', 'closing']);
    expect(stages.slice(1, 6).map((stage) => stage.mystery)).toEqual(set.mysteries);
    expect(countPrayers(stages, {})).toEqual({ marked: 0, total: 71 });
  });

  it('gives every step a unique key, used to save progress', () => {
    const keys = buildStages(rosary, sets[0], prayersById).flatMap((stage) => stage.steps.map((step) => step.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('opening/0');
    expect(keys).toContain('mystery-5/1');
  });

  it('prays ten Hail Marys in each decade, with the Fatima prayer after the Glory Be', () => {
    const [, decade] = buildStages(rosary, sets[0], prayersById);
    const [ourFather, hailMarys, gloryBe] = decade.steps;

    expect(ourFather.prayer.id).toBe('our-father');
    expect([hailMarys.prayer.id, hailMarys.count]).toEqual(['hail-mary', 10]);
    expect([gloryBe.prayer.id, gloryBe.also.map((prayer) => prayer.id)]).toEqual(['glory-be', ['fatima-prayer']]);
    expect(decade.name).toBe('1º mistério');
  });

  it('names the prayer that is missing from prayers.json', () => {
    expect(() => buildStages(rosary, sets[0], new Map())).toThrow('Prayer "sign-of-the-cross" is not in prayers.json');
  });
});

describe('marking prayers', () => {
  const stages = () => buildStages(rosary, sets[0], prayersById);

  it('finishes a step when it is marked as many times as it is prayed', () => {
    const hailMarys = stages()[1].steps[1];
    expect(isStepDone(hailMarys, { [hailMarys.key]: 9 })).toBe(false);
    expect(isStepDone(hailMarys, { [hailMarys.key]: 10 })).toBe(true);
  });

  it('finishes a stage when all of its steps are done', () => {
    const [opening] = stages();
    const counts = Object.fromEntries(opening.steps.map((step) => [step.key, step.count]));

    expect(isStageDone(opening, counts)).toBe(true);
    expect(isStageDone(opening, { ...counts, 'opening/4': 2 })).toBe(false);
  });

  it('never counts more prayers than a step has', () => {
    const all = stages();
    const counts = Object.fromEntries(all.flatMap((stage) => stage.steps.map((step) => [step.key, step.count + 5])));
    expect(countPrayers(all, counts)).toEqual({ marked: 71, total: 71 });
  });
});
