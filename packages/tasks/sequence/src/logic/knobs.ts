import { z } from 'zod'

/**
 * One section of «числовые последовательности»:
 *
 * - `ask` — `next`: four or five numbers and the one after them, `2, 4, 6, □`;
 *   `gap`: five numbers with one missing in the middle, `2, 4, □, 8, 10`;
 * - `step` — how far apart the numbers are: 1 and 2 (up or down, within 20),
 *   5 and 10 (up, from a multiple of the step, within 50 and 100), or
 *   `growing` — the step itself grows by one each time, `1, 2, 4, 7, □`
 *   (asked only as `next`).
 */
export const sequenceKnobs = z
  .strictObject({
    ask: z.enum(['next', 'gap']),
    step: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10), z.literal('growing')]),
  })
  .refine((k) => k.step !== 'growing' || k.ask === 'next', {
    message: 'a growing step is asked only as the next number',
  })

export type SequenceKnobs = z.infer<typeof sequenceKnobs>
export type Step = SequenceKnobs['step']
