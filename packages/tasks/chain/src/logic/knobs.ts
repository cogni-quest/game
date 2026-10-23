import { z } from 'zod'

const shared = {
  terms: z.union([z.literal(3), z.literal(4)]),
  max: z.int().min(10).max(100),
}

/**
 * One section of «порядок действий», `terms` numbers joined by + and −, every
 * step of the work within 0…`max`:
 *
 * - `value` — work it out: left to right `7 + 2 − 5`; with `brackets`, one
 *   pair of brackets that changes the order, `20 − (5 + 3)`; with
 *   `convenient`, only pluses and two terms that make a round ten,
 *   `27 + 15 + 3`, so grouping them is the easy way;
 * - `brackets` — «где скобки?»: `20 − 5 + 3 = 12` is shown without brackets,
 *   and the child picks the placement that gives the result.
 */
export const chainKnobs = z
  .discriminatedUnion('ask', [
    z.strictObject({
      ask: z.literal('value'),
      ...shared,
      brackets: z.literal(true).optional(),
      convenient: z.literal(true).optional(),
    }),
    z.strictObject({ ask: z.literal('brackets'), ...shared }),
  ])
  .refine((k) => k.ask !== 'value' || k.brackets === undefined || k.convenient === undefined, {
    message: '`convenient` is all pluses: brackets would change nothing',
  })

export type ChainKnobs = z.infer<typeof chainKnobs>
