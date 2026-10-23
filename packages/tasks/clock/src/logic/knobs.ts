import { z } from 'zod'

/**
 * One section of «который час?», what the minute hand shows:
 * `hour` — whole hours, `3:00`; `half` — halves, `3:30`;
 * `quarter` — quarters, `3:15` and `3:45`; `five` — any five minutes
 * that is not a quarter, `3:20`.
 */
export const clockKnobs = z.strictObject({
  step: z.enum(['hour', 'half', 'quarter', 'five']),
})

export type ClockKnobs = z.infer<typeof clockKnobs>
export type Step = ClockKnobs['step']
