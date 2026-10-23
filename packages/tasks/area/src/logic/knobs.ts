import { z } from 'zod'

/**
 * One section of «площадь»:
 *
 * - `compare` — two figures of grid cells, left and right: which one is
 *   bigger? Never equal; three cells or more apart, or with `near` one cell
 *   apart — and then the bigger one never has the bigger bounding box, so the
 *   cells have to be counted, not the outline judged;
 * - `cells` — a figure on a grid of 1 cm cells, its area in cells: a
 *   `rectangle`, or a `composite` of two rectangles, an L or a T;
 * - `sides` — a rectangle with its two sides written, sides 2 to `max` cm:
 *   the area is their product.
 */
export const areaKnobs = z.discriminatedUnion('ask', [
  z.strictObject({ ask: z.literal('compare'), near: z.literal(true).optional() }),
  z.strictObject({ ask: z.literal('cells'), shape: z.enum(['rectangle', 'composite']) }),
  z.strictObject({ ask: z.literal('sides'), max: z.int().min(3).max(9) }),
])

export type AreaKnobs = z.infer<typeof areaKnobs>
