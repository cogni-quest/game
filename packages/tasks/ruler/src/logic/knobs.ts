import { z } from 'zod'

/**
 * One section of «измерь линейкой»: a strip lies along a ruler that runs from
 * zero to `max` centimetres, and its length, from `min` to `max`, is asked.
 *
 * - `from` — `zero`: the strip starts at the zero mark; `any`: it starts
 *   further along, so the length is not the number read at its end.
 */
export const rulerKnobs = z
  .strictObject({
    min: z.int().min(1),
    max: z.int().min(5).max(20),
    from: z.enum(['zero', 'any']),
  })
  .refine((k) => k.min <= (k.from === 'zero' ? k.max : k.max - 1), {
    message: 'the shortest strip must fit on the ruler',
  })

export type RulerKnobs = z.infer<typeof rulerKnobs>
