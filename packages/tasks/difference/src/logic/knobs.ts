import { z } from 'zod'

/**
 * One section of «на сколько больше / меньше», numbers up to `max`, asked both
 * ways — «на сколько больше» and «на сколько меньше»:
 *
 * - `picture` — a row of red circles over a row of blue ones, lined up in
 *   pairs, so the ones left without a pair are the answer;
 * - `number` — just the numbers: «на сколько 9 больше, чем 5?».
 *
 * `min` is the least the bigger number can be, so «до 100» does not repeat «до 10».
 */
export const differenceKnobs = z
  .strictObject({
    show: z.enum(['picture', 'number']),
    min: z.int().min(2).optional(),
    max: z.int().min(3).max(100),
  })
  .refine((k) => (k.min ?? 2) <= k.max, { message: 'an empty range' })
  .refine((k) => k.show === 'number' || k.max <= 10, {
    message: 'a picture holds up to ten circles a row',
  })

export type DifferenceKnobs = z.infer<typeof differenceKnobs>
