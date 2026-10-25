import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readData } from './helpers.js';

/**
 * Checks the content of /data. The site reads these files from GitHub raw, so a push
 * to main changes the live site without a build: this is the only check before it does.
 */

const mysteries = readData('mysteries.json');
const prayers = readData('prayers.json');
const rosary = readData('rosary.json');

const ILLUSTRATIONS = new Set(
  readdirSync(resolve(import.meta.dirname, '../../src/assets/illustrations')).map((file) => file.replace(/\.svg$/, '')),
);
const ILLUSTRATION_CSS = readFileSync(
  resolve(import.meta.dirname, '../../src/styles/components/illustration.css'),
  'utf8',
);

const allPrayers = [...prayers.rosaryGroups.flatMap((group) => group.prayers), ...prayers.complementary];
const prayerIds = new Set(allPrayers.map((prayer) => prayer.id));
const rosarySteps = ['opening', 'mystery', 'closing'].flatMap((part) => rosary[part].steps);

const expectText = (value) => {
  expect(value).toBeTypeOf('string');
  expect(value.trim()).not.toBe('');
  expect(value).toBe(value.trim());
};

/** Every string in a JSON value, with its path, e.g. ["sets[0].name", "Mistérios Gozosos"]. */
function* strings(value, path = '') {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (const [index, item] of value.entries()) yield* strings(item, `${path}[${index}]`);
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) yield* strings(item, path ? `${path}.${key}` : key);
}

describe('mysteries.json', () => {
  it('has the four sets', () => {
    expect(mysteries.sets.map((set) => set.id)).toEqual(['joyful', 'sorrowful', 'glorious', 'luminous']);
  });

  it('suggests exactly one set for each day of the week', () => {
    const days = mysteries.sets.flatMap((set) => set.weekdays).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it.each(mysteries.sets.map((set) => [set.id, set]))('%s has its texts and five mysteries', (_id, set) => {
    for (const field of ['name', 'shortName', 'singular', 'weekdaysLabel', 'summary']) expectText(set[field]);
    expect(set.mysteries).toHaveLength(5);

    for (const mystery of set.mysteries) {
      for (const field of ['title', 'shortTitle', 'quote', 'fruit']) expectText(mystery[field]);
      expect(mystery.reflections.length).toBeGreaterThan(0);
      mystery.reflections.forEach(expectText);
      expect(mystery.fruit).not.toMatch(/\.$/);
    }
  });

  it('writes Bible references as "Lc 22,39-46"', () => {
    for (const mystery of mysteries.sets.flatMap((set) => set.mysteries)) {
      expect(mystery.reference).toMatch(/^[1-3]?[A-Z][a-z]{0,2} \d+,\d+(-\d+)?$/);
    }
  });
});

describe('prayers.json', () => {
  it('has unique prayer ids', () => {
    expect(prayerIds.size).toBe(allPrayers.length);
  });

  it('has the complete text of every prayer', () => {
    for (const prayer of allPrayers) {
      for (const field of ['id', 'title', 'when', 'text']) expectText(prayer[field]);
    }
  });

  it('has the invocations and responses of every litany', () => {
    for (const litany of prayers.litanies) {
      for (const field of ['id', 'title', 'note', 'closingPrayer']) expectText(litany[field]);
      expect(litany.lines.length).toBeGreaterThan(0);
      for (const line of litany.lines) {
        expectText(line.invocation);
        expectText(line.response);
      }
    }
  });
});

describe('rosary.json', () => {
  it('only uses prayers that exist in prayers.json', () => {
    const used = rosarySteps.flatMap((step) => [step.prayer, ...(step.also ?? [])]);
    expect(used.filter((id) => !prayerIds.has(id))).toEqual([]);
  });

  it('has one intention per bead when a step lists them', () => {
    for (const step of rosarySteps.filter((item) => item.intentions)) {
      expect(step.intentions).toHaveLength(step.count);
    }
  });

  it('has the 71 prayers of the terço', () => {
    const count = (steps) => steps.reduce((total, step) => total + (step.count ?? 1), 0);
    expect(count(rosary.opening.steps) + 5 * count(rosary.mystery.steps) + count(rosary.closing.steps)).toBe(71);
  });
});

describe('all data', () => {
  const files = { 'mysteries.json': mysteries, 'prayers.json': prayers, 'rosary.json': rosary };

  it('only names illustrations that exist and have a CSS mask', () => {
    for (const [file, data] of Object.entries(files)) {
      for (const [path, name] of strings(data)) {
        if (!path.endsWith('illustration')) continue;
        expect(ILLUSTRATIONS, `${file} ${path}`).toContain(name);
        expect(ILLUSTRATION_CSS, `${file} ${path}`).toContain(`.illustration--${name} {`);
      }
    }
  });

  it('writes ordinals with º/ª, without extra spaces', () => {
    for (const [file, data] of Object.entries(files)) {
      for (const [path, text] of strings(data)) {
        expect(text, `${file} ${path}`).not.toMatch(/\b\d+[oa]\b|\d+°/);
        expect(text, `${file} ${path}`).not.toMatch(/ {2}| \n|\n /);
      }
    }
  });
});
