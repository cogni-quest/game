import { z } from 'zod'

/**
 * One section of «длина ломаной и периметр», every length in centimetres and
 * the answer no more than `max`:
 *
 * - `broken-line` — a broken line of three links, each signed;
 * - `triangle`, `quadrilateral` — every side signed;
 * - `rectangle` — only two neighbouring sides signed: the opposite ones are
 *   the same, and the child is expected to know it;
 * - `square` — one side signed.
 */
export const perimeterKnobs = z.strictObject({
  figure: z.enum(['broken-line', 'triangle', 'quadrilateral', 'rectangle', 'square']),
  max: z.int().min(12).max(200),
})

export type PerimeterKnobs = z.infer<typeof perimeterKnobs>
export type Figure = PerimeterKnobs['figure']
