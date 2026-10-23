import { z } from 'zod'

/**
 * One section of «килограмм и литр», everything up to ten:
 *
 * - `mass` — a thing on the left pan of balanced scales, weights on the right;
 *   how heavy is the thing? `weights`: `ones` — only 1 kg weights; `mixed` —
 *   1, 2 and 5 kg, at least two kinds. `balance` — a weight or two lie on the
 *   left pan next to the thing, so they have to be taken away first;
 * - `volume` — water poured into jars; how many litres? `jars`: `same` — all
 *   of 1 л; `mixed` — 1, 2 and 3 л, at least two kinds.
 */
export const measureKnobs = z.discriminatedUnion('quantity', [
  z.strictObject({
    quantity: z.literal('mass'),
    weights: z.enum(['ones', 'mixed']),
    balance: z.literal(true).optional(),
  }),
  z.strictObject({
    quantity: z.literal('volume'),
    jars: z.enum(['same', 'mixed']),
  }),
])

export type MeasureKnobs = z.infer<typeof measureKnobs>
export type MassKnobs = Extract<MeasureKnobs, { quantity: 'mass' }>
export type VolumeKnobs = Extract<MeasureKnobs, { quantity: 'volume' }>
