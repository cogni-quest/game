import { z } from 'zod'

/**
 * One section of «кто выше?» по фактам: one comparison — выше, старше,
 * тяжелее или быстрее — among `people` children:
 *
 * - `2` — one fact, «Маша выше Пети. Кто ниже?»;
 * - `3` — two facts in a chain, in either order and sometimes said with the
 *   opposite word, «Оля ниже Пети. Маша выше Пети. Кто выше всех?».
 */
export const factsKnobs = z.strictObject({
  people: z.union([z.literal(2), z.literal(3)]),
})

export type FactsKnobs = z.infer<typeof factsKnobs>
