import { z } from 'zod'

/**
 * One section of «сравни выражения», + and − only, every number and value
 * within 0…`max`:
 *
 * - `number-expression` — a number against an expression, `7 □ 3 + 5`, the
 *   number on either side; sometimes they are equal;
 * - `expressions` — two expressions, `9 − 2 □ 3 + 5`; sometimes equal;
 * - `same-term` — «не вычисляя»: one term the same, the other a little
 *   different, `47 + 28 □ 47 + 25`, `63 − 18 □ 63 − 21`; never equal, so the
 *   answer comes from reasoning rather than working both out.
 */
export const expressionsKnobs = z.strictObject({
  sides: z.enum(['number-expression', 'expressions', 'same-term']),
  max: z.int().min(10).max(100),
})

export type ExpressionsKnobs = z.infer<typeof expressionsKnobs>
export type Sides = ExpressionsKnobs['sides']
