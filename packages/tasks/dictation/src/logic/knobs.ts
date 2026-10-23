import { z } from 'zod'

/**
 * One section of «клеточный диктант»: steps from a marked cell on a grid.
 *
 * - `size` — cells to a side, 4 to 8: a bigger grid would make the cells too
 *   small to press;
 * - `steps` — how many steps are dictated;
 * - `longest` — the most cells one step goes, 1 to 4;
 * - `ask` — `end`: where the steps end (the default); `start`: the end is
 *   marked, where did they begin;
 * - `diagonal` — steps may also go corner-wise, `↗`;
 * - `cross` — the path passes some cell twice; without it, never.
 */
export const dictationKnobs = z
  .strictObject({
    size: z.int().min(4).max(8),
    steps: z.int().min(2).max(12),
    longest: z.int().min(1).max(4),
    ask: z.enum(['end', 'start']).optional(),
    diagonal: z.literal(true).optional(),
    cross: z.literal(true).optional(),
  })
  .refine((k) => k.longest < k.size, { message: 'A step must fit inside the grid' })

export type DictationKnobs = z.infer<typeof dictationKnobs>
