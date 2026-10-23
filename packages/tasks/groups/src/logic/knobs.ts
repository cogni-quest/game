import { z } from 'zod'

const terms = {
  minTerms: z.int().min(2).max(5),
  maxTerms: z.int().min(2).max(5),
  maxSize: z.int().min(2).max(9),
}

/**
 * One section of «смысл умножения» and «смысл деления»:
 *
 * - `sum` — equal terms added: `3 + 3 + 3 = □`;
 * - `product` — the same sum as a product: `3 + 3 + 3 = 3 × □`;
 * - `plates` — plates with the same number of candies on each, how many in all;
 * - `array` — circles in rows and columns, how many in all;
 * - `commutative` — `3 × 4 □ 4 × 3`: the swapped product, or a neighbouring
 *   one such as `4 × 4`, answered with «больше / меньше / равно»;
 * - `share` — candies shared equally between plates, how many on each;
 * - `measure-out` — candies put a few to a plate, how many plates.
 *
 * Sharing keeps to `max` candies, at most 20, two to five plates, and at
 * least two on each.
 */
export const groupsKnobs = z
  .discriminatedUnion('ask', [
    z.strictObject({ ask: z.literal('sum'), ...terms }),
    z.strictObject({ ask: z.literal('product'), ...terms }),
    z.strictObject({
      ask: z.literal('plates'),
      maxGroups: z.int().min(2).max(6),
      maxSize: z.int().min(2).max(6),
    }),
    z.strictObject({
      ask: z.literal('array'),
      maxRows: z.int().min(2).max(6),
      maxColumns: z.int().min(2).max(6),
    }),
    z.strictObject({ ask: z.literal('commutative'), maxFactor: z.int().min(3).max(9) }),
    z.strictObject({ ask: z.literal('share'), max: z.int().min(4).max(20) }),
    z.strictObject({ ask: z.literal('measure-out'), max: z.int().min(4).max(20) }),
  ])
  .refine((k) => !('minTerms' in k) || k.minTerms <= k.maxTerms, {
    message: 'more terms at least than at most',
  })

export type GroupsKnobs = z.infer<typeof groupsKnobs>
export type Ask = GroupsKnobs['ask']
