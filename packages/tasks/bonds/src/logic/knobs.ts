import { z } from 'zod'

const TEENS = ['tens', 'ten-plus', 'minus-ones', 'minus-ten'] as const
const PLACES = ['count-tens', 'count-hundreds', 'expand', 'drop'] as const

/**
 * One section of «состав числа», for wholes from `min` to `max`:
 *
 * - `house` — the textbook «домик»: the whole on the roof, two parts below,
 *   one of them empty; wholes up to 10, parts from one up;
 * - `all-pairs` — «какие пары дают 6?»: sums offered as buttons, every one that
 *   makes the whole to be pressed; wholes up to 10;
 * - the teens as a ten and ones, wholes 11…19:
 *   `tens` — `13 = 10 + □`, `□ = 10 + 3`; `ten-plus` — `10 + 7 = □`;
 *   `minus-ones` — `17 − 7 = □`; `minus-ten` — `17 − 10 = □`;
 * - places up to a thousand: `count-tens` — `40 = □ дес.`;
 *   `count-hundreds` — `300 = □ сот.`; `expand` — `47 = 40 + □`,
 *   `347 = 300 + 40 + □`; `drop` — `35 − 30 = □`, `35 − 5 = □`.
 */
export const bondsKnobs = z
  .strictObject({
    form: z.enum(['house', 'all-pairs', ...TEENS, ...PLACES]),
    min: z.int().min(2),
    max: z.int().max(999),
  })
  .refine((k) => k.min <= k.max, { message: 'an empty range' })
  .refine(
    (k) =>
      k.form === 'house' || k.form === 'all-pairs'
        ? k.max <= 10 && (k.form === 'house' || k.min >= 3)
        : (TEENS as readonly string[]).includes(k.form)
          ? k.min >= 11 && k.max <= 19
          : k.min >= 10,
    { message: 'a house holds a whole up to 10; the teens are 11…19; places start at 10' },
  )
  .refine((k) => k.form !== 'count-hundreds' || k.max >= 100, {
    message: 'hundreds start at 100',
  })

export type BondsKnobs = z.infer<typeof bondsKnobs>
export type Form = BondsKnobs['form']
