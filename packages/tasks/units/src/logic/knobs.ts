import { z } from 'zod'

/**
 * One section of «переведи», for a pair of units and amounts up to `max` of
 * the smaller one:
 *
 * - `whole` — a whole number of the bigger unit, either way round:
 *   `2 дм = □ см`, `20 см = □ дм`;
 * - `compound` — both units into the smaller one: `1 дм 3 см = □ см`;
 * - `split` — the smaller one back into both: `13 см = 1 дм □ см`;
 * - `compare-whole` — «сравни» a whole number of the bigger unit with the
 *   smaller: `1 м □ 12 дм`;
 * - `compare` — both units against the smaller: `1 м 3 дм □ 15 дм`.
 */
export const unitsKnobs = z.strictObject({
  pair: z.enum([
    'dm-cm',
    'm-dm',
    'm-cm',
    'cm-mm',
    'rub-kop',
    'h-min',
    'day-h',
    'year-month',
    'kg-g',
    'dm2-cm2',
    'm2-dm2',
  ]),
  form: z.enum(['whole', 'compound', 'split', 'compare-whole', 'compare']),
  max: z.int().min(10).max(10_000),
})

export type UnitsKnobs = z.infer<typeof unitsKnobs>
export type PairId = UnitsKnobs['pair']
export type Form = UnitsKnobs['form']
