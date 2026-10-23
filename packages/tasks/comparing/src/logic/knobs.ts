import { z } from 'zod'

const LEADS: readonly string[] = ['other-lead', 'same-lead', 'trap']

/**
 * One section of «что больше?», for numbers from `min` (one if left out) up to `max`:
 *
 * - `distance` — `far`: four or more apart, `2 □ 9`; `near`: neighbours,
 *   `6 □ 7`; `equal`: the same number on both sides; `any`: anything;
 *   for numbers of two or three digits: `other-lead` — different tens (or
 *   hundreds), `34 □ 52`; `same-lead` — the same tens, `34 □ 37`; `trap` —
 *   neighbouring tens where the smaller number has more units, `19 □ 21`;
 * - `picture` — the left side is drawn as circles rather than written;
 * - `groups` — the left side is two groups of circles, `●●● ●● □ 6`: added in
 *   the head first, then compared (a ★ task). The two sides are never more
 *   than two apart, so the sum has to be worked out.
 */
export const comparingKnobs = z
  .strictObject({
    min: z.int().min(1).optional(),
    max: z.int().min(5).max(1000),
    distance: z.enum(['far', 'near', 'equal', 'any', 'other-lead', 'same-lead', 'trap']),
    picture: z.literal(true).optional(),
    groups: z.literal(true).optional(),
  })
  .refine((k) => k.groups === undefined || k.picture === undefined, {
    message: '`groups` is already a picture',
  })
  .refine((k) => (k.picture === undefined && k.groups === undefined) || k.max <= 10, {
    message: 'a picture holds up to ten circles',
  })
  .refine((k) => k.max - (k.min ?? 1) >= 4, { message: 'too few numbers to compare' })
  .refine((k) => !LEADS.includes(k.distance) || (k.min ?? 1) >= 10, {
    message: 'the tens and hundreds distances are for numbers of two digits and more',
  })
  .refine((k) => LEADS.includes(k.distance) || k.max <= 100, {
    message: 'numbers beyond a hundred are compared by their tens or hundreds',
  })

export type ComparingKnobs = z.infer<typeof comparingKnobs>
