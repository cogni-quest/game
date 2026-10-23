import { z } from 'zod'

/** The most shapes a field to count can hold: a grid of four by three cells. */
export const MAX_FIGURES = 12

/**
 * One section of «фигуры»:
 *
 * - `name` — one shape is drawn and its name is chosen from the names of its
 *   `set`: `familiar` — круг, треугольник, квадрат, прямоугольник; `lines` —
 *   точка, прямая, луч, отрезок, кривая; `polygons` — ломаная, треугольник,
 *   четырёхугольник, пятиугольник, шестиугольник; `quads` — квадрат,
 *   прямоугольник или другой четырёхугольник, без прямых углов;
 * - `count` — a field of `min` to `max` mixed shapes, and how many of the
 *   `target` kind are in it. A `quadrilateral` is any shape with four corners,
 *   so squares and rectangles count too;
 * - `find` — the same field, the shapes numbered, and every one of the
 *   `target` kind is to be pressed: «найди все треугольники»;
 * - `rotated` — shapes are turned and stretched, not in the textbook's pose.
 */
export const shapesKnobs = z
  .discriminatedUnion('ask', [
    z.strictObject({
      ask: z.literal('name'),
      set: z.enum(['familiar', 'lines', 'polygons', 'quads']),
      rotated: z.literal(true).optional(),
    }),
    z.strictObject({
      ask: z.enum(['count', 'find']),
      target: z.enum(['triangle', 'square', 'circle', 'quadrilateral']),
      min: z.int().min(2).max(MAX_FIGURES),
      max: z.int().min(2).max(MAX_FIGURES),
      rotated: z.literal(true).optional(),
    }),
  ])
  .refine((k) => k.ask === 'name' || k.min <= k.max, { message: '`min` is above `max`' })

export type ShapesKnobs = z.infer<typeof shapesKnobs>
export type NameKnobs = Extract<ShapesKnobs, { ask: 'name' }>
export type CountKnobs = Exclude<ShapesKnobs, { ask: 'name' }>
export type ShapeSet = NameKnobs['set']
export type Target = CountKnobs['target']
