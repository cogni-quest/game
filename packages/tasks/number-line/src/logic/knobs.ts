import { z } from 'zod'

/**
 * One section of «числовая прямая»: marks from `min` to `max` every `step`
 * (one if left out), an arrow over one of them, and which marks are signed:
 * `all` but the arrow's, `every-2` (every second mark from `min`), `tens`
 * (the whole tens), or only the `ends`.
 */
export const numberLineKnobs = z
  .strictObject({
    min: z.int().min(0),
    max: z.int().max(1000),
    step: z.int().min(1).optional(),
    labels: z.enum(['all', 'every-2', 'tens', 'ends']),
  })
  .refine(
    (k) => {
      const step = k.step ?? 1
      const steps = (k.max - k.min) / step
      return Number.isInteger(steps) && steps >= 4 && steps <= 20
    },
    { message: 'a line of 4 to 20 whole steps' },
  )

export type NumberLineKnobs = z.infer<typeof numberLineKnobs>
