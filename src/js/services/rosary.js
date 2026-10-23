import { fetchJson } from './api.js';

/**
 * @typedef {import('./prayers.js').Prayer} Prayer
 * @typedef {import('./mysteries.js').MysterySet} MysterySet
 * @typedef {import('./mysteries.js').Mystery} Mystery
 *
 * @typedef {object} Step
 * @property {string} key - Unique in the terço, e.g. "opening/0" or "mystery-2/1"; used to save progress.
 * @property {Prayer} prayer
 * @property {Prayer[]} also - Prayers said together with it (Glória + Ó meu Jesus).
 * @property {string} title
 * @property {string} subtitle
 * @property {number} count - How many times it is prayed (1, or 3 / 10 Hail Marys).
 * @property {string[]} intentions - One per bead, when there is one (Fé, Esperança, Caridade).
 *
 * @typedef {object} Stage
 * @property {string} id - URL value of `step`: "opening", "1"…"5" or "closing".
 * @property {'opening' | 'mystery' | 'closing'} kind
 * @property {string} name - e.g. "Orações iniciais", "2º mistério".
 * @property {string} title - Page title of the stage.
 * @property {string} trailLabel - Short label under the trail medal, e.g. "Início", "2º".
 * @property {string} illustration
 * @property {string} lead
 * @property {string} completedTitle
 * @property {string} completedText
 * @property {Mystery} [mystery]
 * @property {Step[]} steps
 */

/**
 * The sequence of the terço (data/rosary.json): opening, one decade and closing.
 *
 * @throws {Error} When the file can't be loaded or has an unexpected shape.
 */
export async function getRosary() {
  const data = await fetchJson('rosary.json');

  for (const part of ['opening', 'mystery', 'closing']) {
    if (!Array.isArray(data?.[part]?.steps)) throw new Error(`rosary.json is missing "${part}.steps"`);
  }

  return data;
}

/**
 * The seven stages of a terço for one set: opening, the five mysteries and closing.
 *
 * @param {Awaited<ReturnType<typeof getRosary>>} rosary
 * @param {MysterySet} set
 * @param {Map<string, Prayer>} prayersById
 * @returns {Stage[]}
 */
export function buildStages(rosary, set, prayersById) {
  const findPrayer = (id) => {
    const prayer = prayersById.get(id);
    if (!prayer) throw new Error(`Prayer "${id}" is not in prayers.json`);
    return prayer;
  };

  const buildSteps = (prefix, steps) =>
    steps.map((step, index) => {
      const prayer = findPrayer(step.prayer);
      return {
        key: `${prefix}/${index}`,
        prayer,
        also: (step.also ?? []).map(findPrayer),
        title: step.title ?? prayer.title,
        subtitle: step.subtitle ?? '',
        count: step.count ?? 1,
        intentions: step.intentions ?? [],
      };
    });

  const { opening, mystery, closing } = rosary;

  return [
    {
      id: 'opening',
      kind: 'opening',
      name: opening.title,
      title: opening.title,
      trailLabel: opening.trailLabel,
      illustration: opening.illustration,
      lead: opening.lead,
      completedTitle: opening.completedTitle,
      completedText: opening.completedText,
      steps: buildSteps('opening', opening.steps),
    },
    ...set.mysteries.map((item, index) => {
      const ordinal = `${index + 1}º`;
      return {
        id: String(index + 1),
        kind: 'mystery',
        name: `${ordinal} mistério`,
        title: item.title,
        trailLabel: ordinal,
        illustration: item.illustration,
        lead: `${set.name} · ${ordinal} mistério · ${item.reference}`,
        completedTitle: `${ordinal} mistério concluído`,
        completedText: 'Mais uma medalha dourada na sua caminhada. Siga quando estiver pronto.',
        mystery: item,
        steps: buildSteps(`mystery-${index + 1}`, mystery.steps),
      };
    }),
    {
      id: 'closing',
      kind: 'closing',
      name: closing.title,
      title: closing.title,
      trailLabel: closing.trailLabel,
      illustration: closing.illustration,
      lead: closing.lead,
      completedTitle: 'Orações finais completas!',
      completedText: 'Você rezou o terço inteiro. Que Deus abençoe a sua oração.',
      steps: buildSteps('closing', closing.steps),
    },
  ];
}

/** @param {Step} step @param {Record<string, number>} counts */
export const isStepDone = (step, counts) => (counts[step.key] ?? 0) >= step.count;

/** @param {Stage} stage @param {Record<string, number>} counts */
export const isStageDone = (stage, counts) => stage.steps.every((step) => isStepDone(step, counts));

/**
 * @param {Stage[]} stages
 * @param {Record<string, number>} counts
 * @returns {{ marked: number, total: number }} Prayers marked so far, out of all prayers of the terço (71).
 */
export function countPrayers(stages, counts) {
  let marked = 0;
  let total = 0;

  for (const step of stages.flatMap((stage) => stage.steps)) {
    marked += Math.min(counts[step.key] ?? 0, step.count);
    total += step.count;
  }

  return { marked, total };
}
