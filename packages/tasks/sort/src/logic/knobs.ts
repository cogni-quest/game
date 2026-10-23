import { z } from 'zod'

/**
 * One section of «разложи по группам», asked as «выбери все …»:
 *
 * - `category` — words of several kinds, every one of the asked kind to be
 *   pressed: «выбери все фрукты»;
 * - `two-features` — numbered shapes of several shapes and colours, the ones
 *   with both asked features to be pressed: «выбери все красные круги».
 */
export const sortKnobs = z.strictObject({
  by: z.enum(['category', 'two-features']),
})

export type SortKnobs = z.infer<typeof sortKnobs>
