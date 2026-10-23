import { z } from 'zod'

const operation = z.enum(['+', '-'])

/**
 * How the example is shown: `digits` «8 + 5 = ?», `picture` — counters in
 * ten-frames, up to 20 — or `words` «восемь плюс пять». Left out, the plugin
 * mixes them: half in digits, the rest in pictures where they fit, else in
 * words. The graph sets it only for a reason of method — «первые разделы —
 * картинками».
 */
const show = z.enum(['digits', 'picture', 'words']).optional()

/**
 * One section of a topic — one «приём». The curriculum graph lists sections in
 * the textbook's order and the core mixes them into levels; this plugin only
 * builds the examples of one section.
 *
 * | kind | + | − |
 * |---|---|---|
 * | within-10 | `5+1`; `second` fixes the number added, `secondFrom` lets it run from there to 9 (`2+7`), `zero` asks `4+0` | the same for the number taken away: `9-6`, and `zero` asks `4-0`, `4-4` |
 * | cross-ten | `9+2`; `second` fixes the number added — «□ + 2 … □ + 9» | `11-3`; `minuend` fixes the first number — «11 − □ … 18 − □» |
 * | round-tens | `30+40` | `70-40` |
 * | two-digit-ones | `36+2`, nothing carried | `36-2` |
 * | two-digit-tens | `36+20` | `36-20` |
 * | two-digit | any two-digit, place by place, nothing carried | the same, nothing borrowed |
 * | to-round | `26+4` — the units make exactly ten | `30-7` — from whole tens |
 * | ones-carry | `26+7` — a one-digit number carries | `35-7` — a one-digit number borrows |
 * | two-digit-carry | `47+28`, carrying | `63-27`, borrowing |
 * | round-hundreds | `300+200` | `500-200` |
 * | hundreds-tens | `450+30`, the hundred untouched | `480-30` |
 * | tens-carry | `470+80`, tens carry into the hundreds | `560-90` |
 * | three-digit-round | `260+310`, whole tens, nothing carried | `670-140` |
 * | three-digit | any, to 999, carrying or not | any, borrowing or not |
 *
 * Without a limit, `within-10` and `cross-ten` ask their whole table, in both
 * orders; the whole `within-10` table also brings a zero now and then.
 */
export const additionKnobs = z
  .discriminatedUnion('kind', [
    z.strictObject({
      operation,
      show,
      kind: z.literal('within-10'),
      second: z.int().min(1).max(9).optional(),
      secondFrom: z.int().min(1).max(9).optional(),
      zero: z.literal(true).optional(),
    }),
    z.strictObject({
      operation,
      show,
      kind: z.literal('cross-ten'),
      second: z.int().min(2).max(9).optional(),
      minuend: z.int().min(11).max(18).optional(),
    }),
    z.strictObject({ operation, show, kind: z.literal('round-tens') }),
    z.strictObject({ operation, show, kind: z.literal('two-digit-ones') }),
    z.strictObject({ operation, show, kind: z.literal('two-digit-tens') }),
    z.strictObject({ operation, show, kind: z.literal('two-digit') }),
    z.strictObject({ operation, show, kind: z.literal('to-round') }),
    z.strictObject({ operation, show, kind: z.literal('ones-carry') }),
    z.strictObject({ operation, show, kind: z.literal('two-digit-carry') }),
    z.strictObject({ operation, show, kind: z.literal('round-hundreds') }),
    z.strictObject({ operation, show, kind: z.literal('hundreds-tens') }),
    z.strictObject({ operation, show, kind: z.literal('tens-carry') }),
    z.strictObject({ operation, show, kind: z.literal('three-digit-round') }),
    z.strictObject({ operation, show, kind: z.literal('three-digit') }),
  ])
  .superRefine((knobs, ctx) => {
    const problem = (message: string) => {
      ctx.addIssue({ code: 'custom', message })
    }
    if (knobs.show === 'picture' && !['within-10', 'cross-ten'].includes(knobs.kind)) {
      problem('a picture holds numbers up to 20: within-10 and cross-ten')
    }
    if (knobs.kind === 'within-10') {
      const limits = [knobs.second, knobs.secondFrom, knobs.zero].filter((v) => v !== undefined)
      if (limits.length > 1) problem('`second`, `secondFrom` and `zero` do not combine')
    }
    if (knobs.kind === 'cross-ten') {
      if (knobs.operation === '+' && knobs.minuend !== undefined) {
        problem('`minuend` is for subtraction')
      }
      if (knobs.operation === '-' && knobs.second !== undefined) {
        problem('`second` is for addition')
      }
    }
  })

export type AdditionKnobs = z.infer<typeof additionKnobs>
export type Operation = z.infer<typeof operation>
export type Show = NonNullable<z.infer<typeof show>>
