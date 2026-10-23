import { z } from 'zod'

/**
 * One section of «в столбик»: two numbers of `digits` digits written one under
 * the other, added or subtracted (`op`). With `carry` at least one place
 * carries a ten (or borrows one); without it none does.
 */
export const columnKnobs = z.strictObject({
  op: z.enum(['add', 'sub']),
  carry: z.boolean(),
  digits: z.union([z.literal(2), z.literal(3)]),
})

export type ColumnKnobs = z.infer<typeof columnKnobs>
export type Op = ColumnKnobs['op']
