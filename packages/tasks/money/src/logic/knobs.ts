import { z } from 'zod'

/**
 * One section of «деньги», in roubles:
 *
 * - `count` — coins of 1, 2, 5 and 10 р, two to six of them and of at least
 *   two kinds, worth up to `max` in all; with `notes` there is a note of 50 р
 *   among them too (100 р, if it fits);
 * - `change` — a price and a coin or note of `from` roubles: «сколько сдачи?»;
 * - `make` — a purse of five to eight coins (and notes, up to 100), and a sum
 *   up to `max` to be made from some of them: «набери 8 рублей».
 */
export const moneyKnobs = z
  .discriminatedUnion('ask', [
    z.strictObject({
      ask: z.literal('count'),
      max: z.int().min(10).max(100),
      notes: z.literal(true).optional(),
    }),
    z.strictObject({
      ask: z.literal('make'),
      max: z.union([z.literal(10), z.literal(100)]),
    }),
    z.strictObject({
      ask: z.literal('change'),
      from: z.union([z.literal(10), z.literal(100)]),
    }),
  ])
  .refine((k) => k.ask !== 'count' || k.notes === undefined || k.max > 50, {
    message: 'a note of 50 р needs a total above 50',
  })

export type MoneyKnobs = z.infer<typeof moneyKnobs>
