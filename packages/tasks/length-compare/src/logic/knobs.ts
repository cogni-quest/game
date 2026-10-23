import { z } from 'zod'

/**
 * One section of «что длиннее?», two strips one above the other:
 *
 * - `ask` — which one is `longer`, or which one is `shorter`;
 * - `gap` — `far`: four centimetres or more apart; `near`: one apart; `any`;
 * - `shifted` — the strips do not start at the same edge, so the one that
 *   reaches further is not always the longer one;
 * - `equal` — sometimes the strips are the same, and «одинаковые» is offered.
 */
export const lengthCompareKnobs = z.strictObject({
  ask: z.enum(['longer', 'shorter']),
  gap: z.enum(['far', 'near', 'any']),
  shifted: z.literal(true).optional(),
  equal: z.literal(true).optional(),
})

export type LengthCompareKnobs = z.infer<typeof lengthCompareKnobs>
export type Ask = LengthCompareKnobs['ask']
