import { z } from 'zod'

/**
 * One section of «олимпиадные» (Кенгуру): one trick, one number.
 *
 * - `figures` — «Сколько треугольников на рисунке?». Without `overlap`, the
 *   figures stand apart and only the asked kind is counted; with it, they are
 *   made of shared lines — a triangle cut from its top, a rectangle cut into
 *   strips, a square with its diagonals, a grid — and the big figures made of
 *   small ones count too;
 * - `weighing` — balance scales in equilibrium, swapped one for another:
 *   `chain: 1` — «1 арбуз весит как 3 дыни; сколько дынь весят как 2
 *   арбуза?»; `chain: 2` — two swaps in a row, арбуз → дыни → яблоки.
 */
export const olympiadKnobs = z.discriminatedUnion('ask', [
  z.strictObject({ ask: z.literal('figures'), overlap: z.boolean() }),
  z.strictObject({ ask: z.literal('weighing'), chain: z.union([z.literal(1), z.literal(2)]) }),
])

export type OlympiadKnobs = z.infer<typeof olympiadKnobs>
