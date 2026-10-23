import { z } from 'zod'

/**
 * One section of «узоры из фигур», a row of coloured figures that repeats:
 *
 * - `ask` — `next`: what comes after the row, `● ▲ ● ▲ ● ?`; `missing`: which
 *   figure is gone from inside it, `● ▲ ? ▲ ●`;
 * - `unit` — what repeats: `two` figures in turn, `AB`; `three`, as `ABC`,
 *   `AAB` or `ABB`; `two-features` — shape and colour each keep their own
 *   turn (one every two, the other every three), so the answer must match
 *   both.
 */
export const patternKnobs = z.strictObject({
  ask: z.enum(['next', 'missing']),
  unit: z.enum(['two', 'three', 'two-features']),
})

export type PatternKnobs = z.infer<typeof patternKnobs>
