import { z } from 'zod'

/**
 * One section of «повтори огоньки»: lights on a square panel flash one by
 * one, and the child presses them back in order — visual-spatial working
 * memory, the way the Corsi blocks test it.
 *
 * - `size` — lights to a side, 3 to 5: more lights to choose from is harder
 *   to hold, and the panel still fits a press per light;
 * - `length` — how many lights flash, 2 to 9; never the same light twice;
 * - `order` — `forward`: press them as they flashed (the default);
 *   `backward`: from the last to the first, which asks the memory to work on
 *   what it holds, not just keep it;
 * - `colours` — when given, 2 to 4: each light flashes in one of that many
 *   colours, and the child gives back the colour too — two things bound to
 *   each place, not one. Without it every flash is the same colour and only
 *   the place and the order count.
 */
export const lightsKnobs = z
  .strictObject({
    size: z.int().min(3).max(5),
    length: z.int().min(2).max(9),
    order: z.enum(['forward', 'backward']).optional(),
    colours: z.int().min(2).max(4).optional(),
  })
  .refine((k) => k.length <= k.size * k.size, {
    message: 'More lights flash than the panel has',
  })
  .refine((k) => k.colours === undefined || k.colours <= k.length, {
    message: 'More colours than lights: some could never flash',
  })

export type LightsKnobs = z.infer<typeof lightsKnobs>
