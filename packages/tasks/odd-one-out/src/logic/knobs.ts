import { z } from 'zod'

/**
 * One section of «найди лишнее»: four items in a row, one does not belong.
 * What sets it apart:
 *
 * - `shape` — three of one shape and one of another, all one colour;
 * - `colour-size` — one shape throughout, the odd one differs in colour or in
 *   size, never in both;
 * - `meaning` — three words from one group (фрукты, овощи, животные,
 *   транспорт) and one from another;
 * - `parity` — numbers up to 20, three even and one odd, or the other way;
 * - `multiple` — numbers up to 50, three divide by 3, 4 or 5 and one does not.
 */
export const oddOneOutKnobs = z.strictObject({
  by: z.enum(['shape', 'colour-size', 'meaning', 'parity', 'multiple']),
})

export type OddOneOutKnobs = z.infer<typeof oddOneOutKnobs>
export type By = OddOneOutKnobs['by']
