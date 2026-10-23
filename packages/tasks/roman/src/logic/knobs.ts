import { z } from 'zod'

/**
 * One section of «римские цифры»: a numeral from one to `max` is shown and
 * read as a number. Above ten most of the numerals are above the section
 * before — above 10 for `max` 20, above 20 for `max` 40.
 */
export const romanKnobs = z.strictObject({
  max: z.int().min(5).max(40),
})

export type RomanKnobs = z.infer<typeof romanKnobs>
