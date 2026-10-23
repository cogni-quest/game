import { z } from 'zod'

/** A table, or a skip-counting row, is always of one number from 2 to 9. */
const table = z.int().min(2).max(9)

/**
 * One section of multiplication and division, `7 × 3 = □`:
 *
 * - `table-mul`, `table-div` — the table of `by`: `by × k` or `k × by` for k
 *   from `by` to 9, the facts not already in a smaller table (`3 × 2` is the
 *   table of 2), and `(by·k) : by` for k 2…9;
 * - by 0, 1 and 10, the other number 2…10: `by-1` `a × 1`, `by-0` `a × 0`,
 *   `by-10` `a × 10`; `div-1` `a : 1`, `self` `a : a`, `zero-div` `0 : a`,
 *   `div-10` `(a·10) : 10`;
 * - beyond the table, everything up to 100: `round-mul` `20 × 3`,
 *   `two-digit-mul` `23 × 4`, `round-div` `60 : 3`, `round-by-round`
 *   `80 : 20`, `sum-div` `78 : 2`, `guess-div` `87 : 29`;
 * - `times-10-100` — `a × 10` for a 11…99, or `a × 100` for a 2…9;
 *   `div-by-10` — `(a·10) : 10` for a 11…99 (up to 10 is `div-10`);
 * - `skip` — counting «прыжками» by `by`: `2, 4, 6, □`.
 *
 * The ranges never overlap, so no two kinds ask the same example.
 */
export const timesKnobs = z.union([
  z.strictObject({ kind: z.enum(['table-mul', 'table-div', 'skip']), by: table }),
  z.strictObject({ kind: z.literal('times-10-100'), by: z.union([z.literal(10), z.literal(100)]) }),
  z.strictObject({
    kind: z.enum([
      'by-1',
      'by-0',
      'by-10',
      'div-1',
      'self',
      'zero-div',
      'div-10',
      'round-mul',
      'two-digit-mul',
      'round-div',
      'round-by-round',
      'sum-div',
      'guess-div',
      'div-by-10',
    ]),
  }),
])

export type TimesKnobs = z.infer<typeof timesKnobs>
export type Kind = TimesKnobs['kind']
