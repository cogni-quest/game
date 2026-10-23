import { z } from 'zod'

/**
 * One section of «деление с остатком», dividends up to `max`, divisors 2…9,
 * the remainder never zero. The answer is two numbers, the core takes one, so
 * each task asks one of them: the `quotient` or the `remainder` (either, at
 * random, when left out).
 *
 * - `number` — `17 : 5 = □ (ост. 2)`, `17 : 5 = 3 (ост. □)`;
 * - `picture` — candies laid out in framed heaps of the divisor, the rest
 *   apart: «сколько полных кучек?», «сколько осталось?»; up to 20.
 */
export const remainderKnobs = z
  .strictObject({
    show: z.enum(['picture', 'number']),
    max: z.int().min(10).max(100),
    ask: z.enum(['quotient', 'remainder']).optional(),
  })
  .refine((k) => k.show === 'number' || k.max <= 20, {
    message: 'a picture holds up to 20 candies',
  })

export type RemainderKnobs = z.infer<typeof remainderKnobs>
export type Ask = NonNullable<RemainderKnobs['ask']>
