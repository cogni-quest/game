import { z } from 'zod'

/**
 * One section of «соседи числа», for numbers from zero to `max`:
 * `next` — after 6; `previous` — before 6; `between` — between 4 and 6;
 * `skip-next`, `skip-previous` — one place further: «через одно после 4» (a ★ task).
 */
export const neighboursKnobs = z.strictObject({
  max: z.int().min(5).max(100),
  ask: z.enum(['next', 'previous', 'between', 'skip-next', 'skip-previous']),
})

export type NeighboursKnobs = z.infer<typeof neighboursKnobs>
export type Ask = NeighboursKnobs['ask']
