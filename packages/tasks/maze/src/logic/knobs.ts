import { z } from 'zod'

/**
 * One section of «лабиринты»: which exit leads to the treasure.
 *
 * - `size` — `small`: 5 × 5 cells; `big`: 7 × 7;
 * - `exits` — how many numbered exits the border has, 3 or 4;
 * - `key` — every exit reaches the treasure, but the way must pass a key, and
 *   only one exit's way does (Петерсон).
 */
export const mazeKnobs = z.strictObject({
  size: z.enum(['small', 'big']),
  exits: z.union([z.literal(3), z.literal(4)]),
  key: z.literal(true).optional(),
})

export type MazeKnobs = z.infer<typeof mazeKnobs>
export type Size = MazeKnobs['size']
