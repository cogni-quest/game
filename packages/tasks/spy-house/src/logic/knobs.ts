import { z } from 'zod'

/**
 * The kinds of clue a report can give (CURRICULUM.md, «floors-sides»):
 *
 * - `floor` — «на 3 этаже», counted from the ground;
 * - `edge` — «в левом окне», «в крайнем правом», «в среднем»;
 * - `ordinal` — «во втором окне слева», «в третьем окне справа»;
 * - `beside` — «сразу слева от 🐱»: the next window on the same floor;
 * - `between` — «между 🐱 и 🌵»: one landmark on each side;
 * - `vertical` — «сразу над 🐱», «сразу под 🐱»: a floor up or down.
 */
export const CLUE_KINDS = ['floor', 'edge', 'ordinal', 'beside', 'between', 'vertical'] as const
export type ClueKind = (typeof CLUE_KINDS)[number]

/** The kinds that point at a landmark, and so need some in the house. */
export const LANDMARK_KINDS: ReadonlySet<ClueKind> = new Set(['beside', 'between', 'vertical'])

/** How many windows a floor needs for a kind to make sense. */
const MIN_WINDOWS: Record<ClueKind, number> = {
  floor: 1,
  edge: 2,
  // On three windows «второе слева» is «среднее»: counting starts at four.
  ordinal: 4,
  beside: 2,
  between: 3,
  vertical: 1,
}

/**
 * One section of «найди шпиона»: a house of five floors, and a report of
 * clues that fits exactly one of its empty windows.
 *
 * - `windows` — windows a floor, 1 to 5;
 * - `recipes` — the sets of clue kinds a report is made of, one picked per
 *   task; every clue of a report is needed — without any one of them more
 *   than one window would fit;
 * - `landmarks` — how many windows hold a cat, a cactus or a teddy; needed
 *   when a recipe points at them, and always fewer than the windows, so the
 *   spy has somewhere to be.
 */
export const spyHouseKnobs = z
  .strictObject({
    windows: z.int().min(1).max(5),
    recipes: z
      .array(
        z
          .array(z.enum(CLUE_KINDS))
          .min(1)
          .max(3)
          .refine((kinds) => new Set(kinds).size === kinds.length, {
            message: 'A recipe names a kind twice',
          }),
      )
      .min(1),
    landmarks: z.int().min(0).max(15).optional(),
  })
  .refine((k) => k.recipes.flat().every((kind) => k.windows >= MIN_WINDOWS[kind]), {
    message: 'A clue kind needs more windows a floor',
  })
  .refine(
    (k) => !k.recipes.flat().some((kind) => LANDMARK_KINDS.has(kind)) || (k.landmarks ?? 0) >= 2,
    { message: 'Clues about landmarks need landmarks in the house' },
  )
  .refine((k) => (k.landmarks ?? 0) <= k.windows * 5 - 5, {
    message: 'Too many landmarks: the spy needs empty windows',
  })

export type SpyHouseKnobs = z.infer<typeof spyHouseKnobs>
