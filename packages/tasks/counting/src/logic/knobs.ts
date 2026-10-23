import { z } from 'zod'

/**
 * One section of «сколько предметов?»:
 *
 * - `min`–`max` — how many objects there can be;
 * - `layout` — `row`: in a line, seen at a glance; `frame`: in a ten-frame,
 *   counted from the five; `scattered`: anywhere, the hardest to keep track of;
 * - `distractors` — other objects mixed in, and only the red ones are counted.
 */
export const countingKnobs = z
  .strictObject({
    min: z.int().min(1).max(10),
    max: z.int().min(1).max(10),
    layout: z.enum(['row', 'frame', 'scattered']),
    distractors: z.literal(true).optional(),
  })
  .refine((k) => k.min <= k.max, { message: '`min` is above `max`' })
  .refine((k) => k.distractors === undefined || k.layout === 'scattered', {
    message: 'distractors only make sense scattered',
  })

export type CountingKnobs = z.infer<typeof countingKnobs>
export type Layout = CountingKnobs['layout']
