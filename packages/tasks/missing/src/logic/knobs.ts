import { z } from 'zod'

/**
 * One section of «неизвестное слагаемое» and the equations after it, numbers
 * up to `max`, every term from one up. Which term is unknown:
 * `second` — `3 + □ = 5`; `first` — `□ + 2 = 5`; `subtrahend` — `7 − □ = 3`;
 * `minuend` — `□ − 3 = 4`; `factor` — `3 × □ = 12`, the known factor being
 * `by` (the products then run to `by · 10`, and `max` is not used).
 *
 * `min` raises the biggest number of the equation, so a later section does not
 * repeat an earlier one: `7 − □ = 3` to 10, then from 11 to 20.
 *
 * `letter` writes the unknown as `x`, the way equations look from grade 2.
 */
export const missingKnobs = z
  .strictObject({
    blank: z.enum(['second', 'first', 'subtrahend', 'minuend', 'factor']),
    min: z.int().min(2).optional(),
    max: z.int().min(3).max(100),
    by: z.int().min(2).max(9).optional(),
    letter: z.literal(true).optional(),
  })
  .refine((k) => (k.min ?? 2) < k.max, { message: 'an empty range' })
  .refine((k) => (k.blank === 'factor') === (k.by !== undefined), {
    message: '`by` is the known factor, and only a factor has one',
  })

export type MissingKnobs = z.infer<typeof missingKnobs>
export type Blank = MissingKnobs['blank']
