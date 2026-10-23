import { z } from 'zod'

/**
 * Problems that can be told as a picture — rows of counters, the ones added
 * and taken away marked — for a child who listens rather than reads.
 */
export const PICTURED = [
  'sum',
  'take',
  'gained',
  'more-by',
  'less-by',
  'difference',
  'sum-take',
  'take-sum',
  'more-by-sum',
] as const

/** Counters in a picture are drawn one by one, so a row holds this many at most. */
export const PICTURE_MAX = 20

/** Two-step problems, whose plan can be asked instead of the answer. */
export const TWO_STEP = ['sum-take', 'take-sum', 'more-by-sum'] as const

/**
 * One section of word problems, every number up to `max`:
 *
 * - one step: `sum` «было 3, дали ещё 2»; `take` «было 7, 3 отдала»;
 *   `gained` «было 3, стало 8 — сколько подарили?»; `more-by`, `less-by`
 *   «у Пети на 2 больше»; `difference` «на сколько больше?»;
 *   `increase`, `decrease` — bare «увеличь 7 на 3»;
 * - two steps: `sum-take`, `take-sum`, `more-by-sum` «…сколько у них вместе?»;
 * - multiplication and division: `mult` «на 4 тарелках по 3»; `share` «12
 *   поровну на 3 тарелки»; `cost`, `price`, `quantity` — цена, количество,
 *   стоимость; `times-more`, `times-less` «в 3 раза больше»; `times-ratio`
 *   «во сколько раз больше?»; `times-increase`, `times-decrease` — bare
 *   «увеличь 6 в 3 раза»;
 * - puzzles: `queue` «Маша 4-я с начала и 3-я с конца — сколько всего?»;
 *   `age-gap` «на сколько Маша будет старше через 5 лет?» — the gap stays;
 *   `age-later` «сколько лет будет Пете, когда Маше будет 10?».
 *
 * `picture` shows the story as counters as well (`PICTURED` kinds, up to
 * `PICTURE_MAX`): «картинка-история», the text read aloud by the teacher.
 *
 * `min`: the biggest number of the problem, its answer included, is at least
 * this, so «до 100» does not repeat «до 10».
 *
 * `ask: 'plan'` asks a two-step problem's plan instead of its answer:
 * «сначала +, потом −».
 */
export const wordKnobs = z
  .strictObject({
    kind: z.enum([
      'sum',
      'take',
      'gained',
      'more-by',
      'less-by',
      'difference',
      'increase',
      'decrease',
      'mult',
      'share',
      'cost',
      'price',
      'quantity',
      'times-more',
      'times-less',
      'times-ratio',
      'times-increase',
      'times-decrease',
      'queue',
      'age-gap',
      'age-later',
      ...TWO_STEP,
    ]),
    min: z.int().min(2).optional(),
    max: z.int().min(5).max(100),
    ask: z.literal('plan').optional(),
    picture: z.literal(true).optional(),
  })
  .refine(
    (k) =>
      k.picture === undefined ||
      ((PICTURED as readonly string[]).includes(k.kind) && k.max <= PICTURE_MAX),
    { message: 'only a story of counters up to 20 can be told as a picture' },
  )
  .refine((k) => k.ask === undefined || (TWO_STEP as readonly string[]).includes(k.kind), {
    message: 'only a two-step problem has a plan to ask',
  })

export type WordKnobs = z.infer<typeof wordKnobs>
export type Kind = WordKnobs['kind']
