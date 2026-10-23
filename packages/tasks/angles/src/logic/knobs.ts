import { z } from 'zod'

/**
 * One section of «прямой угол»:
 *
 * - `is-right` — one angle, «это прямой угол?», да или нет; right about half
 *   the time;
 * - `which` — three angles numbered 1, 2, 3, exactly one of them right.
 *
 * The other angles are clearly sharp or blunt, 30–60° or 120–150°; with `near`
 * they are close to right, 70–80° or 100–110°, so the eye alone will not do.
 */
export const anglesKnobs = z.strictObject({
  ask: z.enum(['is-right', 'which']),
  near: z.literal(true).optional(),
})

export type AnglesKnobs = z.infer<typeof anglesKnobs>
export type Ask = AnglesKnobs['ask']
