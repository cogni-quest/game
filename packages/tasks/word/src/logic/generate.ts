import {
  choiceAnswer,
  counted,
  numberAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Forms,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { Kind, TWO_STEP, WordKnobs } from './knobs'
import { PEOPLE, THINGS, type Person } from './people'

export type Plan = 'add-take' | 'add-add' | 'take-add' | 'take-take'

export const PLANS = [
  { value: 'add-take', label: 'сначала +, потом −' },
  { value: 'add-add', label: 'сначала +, потом +' },
  { value: 'take-add', label: 'сначала −, потом +' },
  { value: 'take-take', label: 'сначала −, потом −' },
] as const

const PLAN_OF: Record<(typeof TWO_STEP)[number], Plan> = {
  'sum-take': 'add-take',
  'take-sum': 'take-add',
  'more-by-sum': 'add-add',
}

/** Counters of one kind in a picture: there all along, added, taken away, or unknown. */
export interface ScenePart {
  readonly count: number | 'unknown'
  readonly mark: 'plain' | 'added' | 'removed'
}

/** One row of a picture: whose counters, or what they are. */
export interface SceneRow {
  readonly label: string
  readonly parts: readonly ScenePart[]
}

export interface WordPrompt {
  readonly kind: Kind
  readonly ask: 'answer' | 'plan'
  readonly text: string
  /** The story as counters, for `picture`. */
  readonly scene?: readonly SceneRow[]
}

export type WordAnswer = NumberAnswer | ChoiceAnswer<Plan>
export type WordTask = Task<WordPrompt, WordAnswer>

export const PLUGIN_ID = 'word'

export function isWordTask(task: Task): task is WordTask {
  return task.pluginId === PLUGIN_ID
}

/** What a story is told about: two children and a kind of thing. */
interface Cast {
  readonly p: Person
  readonly q: Person
  readonly thing: Forms
  readonly n: (count: number) => string
  /** «яблок», after «сколько». */
  readonly many: string
}

/**
 * Each kind of problem: which three drawn numbers fit it (the third is ignored
 * by most), its answer and its story. A number told with «было», «дали» or
 * «стало» is never one, so the verb never has to agree with it.
 */
interface Rule {
  fits(a: number, b: number, c: number, max: number): boolean
  answer(a: number, b: number, c: number): number
  /** How many of the drawn numbers the problem uses. */
  readonly uses: 2 | 3
  tell(a: number, b: number, c: number, cast: Cast): string
}

type Scene = (a: number, b: number, c: number, cast: Cast) => readonly SceneRow[]

const plain = (count: number): ScenePart => ({ count, mark: 'plain' })
const added = (count: number | 'unknown'): ScenePart => ({ count, mark: 'added' })
const removed = (count: number): ScenePart => ({ count, mark: 'removed' })

/** How a picture tells each drawable kind. */
const SCENES: Partial<Record<Kind, Scene>> = {
  sum: (a, b, _, { p }) => [{ label: p.nom, parts: [plain(a), added(b)] }],
  take: (a, b, _, { p }) => [{ label: p.nom, parts: [plain(a - b), removed(b)] }],
  gained: (a, b, _, { p }) => [
    { label: p.nom, parts: [plain(a), added('unknown')] },
    { label: 'стало', parts: [plain(b)] },
  ],
  'more-by': (a, b, _, { p, q }) => [
    { label: p.nom, parts: [plain(a)] },
    { label: q.nom, parts: [plain(a), added(b)] },
  ],
  'less-by': (a, b, _, { p, q }) => [
    { label: p.nom, parts: [plain(a)] },
    { label: q.nom, parts: [plain(a - b), removed(b)] },
  ],
  difference: (a, b, _, { p, q }) => [
    { label: p.nom, parts: [plain(a)] },
    { label: q.nom, parts: [plain(b)] },
  ],
  'sum-take': (a, b, c, { p }) => [
    { label: p.nom, parts: [plain(a), added(b)] },
    { label: ended(p, 'отдал'), parts: [removed(c)] },
  ],
  'take-sum': (a, b, c, { p }) => [{ label: p.nom, parts: [plain(a - b), removed(b), added(c)] }],
  'more-by-sum': (a, b, _, { p, q }) => [
    { label: p.nom, parts: [plain(a)] },
    { label: q.nom, parts: [plain(a), added(b)] },
  ],
}

const TIMES: Forms = ['раз', 'раза', 'раз']
const YEARS: Forms = ['год', 'года', 'лет']
const ordinal = (n: number, person: Person) => `${String(n)}-${person.she ? 'я' : 'й'}`
const ROUBLES: Forms = ['рубль', 'рубля', 'рублей']
const PLATES: Forms = ['тарелка', 'тарелки', 'тарелок']

/** Both factors of a table fact, two to ten. */
const table = (a: number, b: number) => a >= 2 && a <= 10 && b >= 2 && b <= 10
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const ended = (person: Person, verb: string) => `${verb}${person.she ? 'а' : ''}`
const pronoun = (person: Person) => (person.she ? 'она' : 'он')

const ADDING = {
  sum: {
    fits: (a, b, _, max) => a >= 2 && b >= 2 && a + b <= max,
    answer: (a, b) => a + b,
    uses: 2,
    tell: (a, b, _, { p, n, many }) =>
      `У ${p.gen} было ${n(a)}. ${p.dat} дали ещё ${n(b)}. Сколько ${many} стало у ${p.gen}?`,
  },
  take: {
    fits: (a, b) => b >= 2 && a - b >= 1,
    answer: (a, b) => a - b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} было ${n(a)}. ${n(b)} ${pronoun(p)} ${ended(p, 'отдал')} ${q.dat}. Сколько ${many} осталось у ${p.gen}?`,
  },
  gained: {
    fits: (a, b) => a >= 2 && b > a,
    answer: (a, b) => b - a,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} было ${n(a)}. ${q.nom} ${ended(q, 'подарил')} ${p.dat} ещё несколько, и стало ${n(b)}. Сколько ${many} ${ended(q, 'подарил')} ${q.nom}?`,
  },
  'more-by': {
    fits: (a, b, _, max) => a >= 2 && a + b <= max,
    answer: (a, b) => a + b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a)}, а у ${q.gen} на ${String(b)} больше. Сколько ${many} у ${q.gen}?`,
  },
  'less-by': {
    fits: (a, b) => a >= 2 && a - b >= 1,
    answer: (a, b) => a - b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a)}, а у ${q.gen} на ${String(b)} меньше. Сколько ${many} у ${q.gen}?`,
  },
  // The third number picks the question: 1 — «больше», 2 — «меньше».
  difference: {
    fits: (a, b, c) => a >= 2 && b >= 2 && a !== b && c <= 2,
    answer: (a, b) => Math.abs(a - b),
    uses: 3,
    tell: (a, b, c, { p, q, n, many }) => {
      const [big, small] = a > b ? [p, q] : [q, p]
      const question =
        c === 1
          ? `На сколько ${many} у ${big.gen} больше, чем у ${small.gen}?`
          : `На сколько ${many} у ${small.gen} меньше, чем у ${big.gen}?`
      return `У ${p.gen} ${n(a)}, а у ${q.gen} ${n(b)}. ${question}`
    },
  },
  increase: {
    fits: (a, b, _, max) => a + b <= max,
    answer: (a, b) => a + b,
    uses: 2,
    tell: (a, b) => `Увеличь ${String(a)} на ${String(b)}.`,
  },
  decrease: {
    fits: (a, b) => a - b >= 1,
    answer: (a, b) => a - b,
    uses: 2,
    tell: (a, b) => `Уменьши ${String(a)} на ${String(b)}.`,
  },
  'sum-take': {
    fits: (a, b, c, max) => a >= 2 && b >= 2 && c >= 2 && a + b <= max && a + b - c >= 1,
    answer: (a, b, c) => a + b - c,
    uses: 3,
    tell: (a, b, c, { p, q, n, many }) =>
      `У ${p.gen} было ${n(a)}. ${p.dat} дали ещё ${n(b)}. Потом ${n(c)} ${pronoun(p)} ${ended(p, 'отдал')} ${q.dat}. Сколько ${many} осталось у ${p.gen}?`,
  },
  'take-sum': {
    fits: (a, b, c, max) => b >= 2 && c >= 2 && a - b >= 1 && a - b + c <= max,
    answer: (a, b, c) => a - b + c,
    uses: 3,
    tell: (a, b, c, { p, q, n, many }) =>
      `У ${p.gen} было ${n(a)}. ${n(b)} ${pronoun(p)} ${ended(p, 'отдал')} ${q.dat}. Потом ${p.dat} дали ещё ${n(c)}. Сколько ${many} стало у ${p.gen}?`,
  },
  'more-by-sum': {
    fits: (a, b, _, max) => a >= 2 && 2 * a + b <= max,
    answer: (a, b) => 2 * a + b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a)}, а у ${q.gen} на ${String(b)} больше. Сколько ${many} у них вместе?`,
  },
} satisfies Record<string, Rule>

const MULTIPLYING = {
  mult: {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a, b) => a * b,
    uses: 2,
    tell: (a, b, _, { n, many }) =>
      `На ${String(a)} тарелках лежит по ${n(b)}. Сколько всего ${many}?`,
  },
  share: {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a) => a,
    uses: 2,
    tell: (a, b, _, { n, many }) =>
      `${n(a * b)} разложили поровну на ${counted(b, PLATES)}. Сколько ${many} на каждой тарелке?`,
  },
  cost: {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a, b) => a * b,
    uses: 2,
    tell: (a, b, _, { thing, n }) =>
      `${capital(thing[0])} стоит ${counted(a, ROUBLES)}. Сколько рублей стоят ${n(b)}?`,
  },
  price: {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a) => a,
    uses: 2,
    tell: (a, b, _, { thing, n }) =>
      `${n(b)} стоят ${counted(a * b, ROUBLES)}. Сколько рублей стоит 1 ${thing[0]}?`,
  },
  quantity: {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (_, b) => b,
    uses: 2,
    tell: (a, b, _, { thing, many }) =>
      `${capital(thing[0])} стоит ${counted(a, ROUBLES)}. Купили ${many} на ${counted(a * b, ROUBLES)}. Сколько ${many} купили?`,
  },
  'times-more': {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a, b) => a * b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a)}, а у ${q.gen} в ${counted(b, TIMES)} больше. Сколько ${many} у ${q.gen}?`,
  },
  'times-less': {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a) => a,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a * b)}, а у ${q.gen} в ${counted(b, TIMES)} меньше. Сколько ${many} у ${q.gen}?`,
  },
  'times-ratio': {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (_, b) => b,
    uses: 2,
    tell: (a, b, _, { p, q, n, many }) =>
      `У ${p.gen} ${n(a * b)}, а у ${q.gen} ${n(a)}. Во сколько раз у ${p.gen} больше ${many}, чем у ${q.gen}?`,
  },
  'times-increase': {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a, b) => a * b,
    uses: 2,
    tell: (a, b) => `Увеличь ${String(a)} в ${counted(b, TIMES)}.`,
  },
  'times-decrease': {
    fits: (a, b, _, max) => table(a, b) && a * b <= max,
    answer: (a) => a,
    uses: 2,
    tell: (a, b) => `Уменьши ${String(a * b)} в ${counted(b, TIMES)}.`,
  },
} satisfies Record<string, Rule>

const PUZZLES = {
  queue: {
    fits: (a, b, _, max) => a >= 2 && b >= 2 && a + b - 1 <= max,
    answer: (a, b) => a + b - 1,
    uses: 2,
    tell: (a, b, _, { p }) =>
      `${p.nom} стоит в очереди ${ordinal(a, p)} с начала и ${ordinal(b, p)} с конца. Сколько всего детей в очереди?`,
  },
  'age-gap': {
    fits: (a, b) => a <= 9 && b >= 2 && b <= 10,
    answer: (a) => a,
    uses: 2,
    tell: (a, b, _, { p, q }) =>
      `${p.nom} старше ${q.gen} на ${counted(a, YEARS)}. На сколько лет ${p.nom} будет старше ${q.gen} через ${counted(b, YEARS)}?`,
  },
  'age-later': {
    fits: (a, b, c, max) => a >= 2 && b >= 2 && a !== b && c > a && b + c - a <= max,
    answer: (a, b, c) => b + c - a,
    uses: 3,
    tell: (a, b, c, { p, q }) =>
      `Сейчас ${p.dat} ${counted(a, YEARS)}, а ${q.dat} ${counted(b, YEARS)}. Сколько лет будет ${q.dat}, когда ${p.dat} будет ${counted(c, YEARS)}?`,
  },
} satisfies Record<string, Rule>

const RULES: Record<Kind, Rule> = { ...ADDING, ...MULTIPLYING, ...PUZZLES }

const TRIES = 10_000

export function generateWord(
  { kind, min, max, ask, picture }: WordKnobs,
  random: Random,
): WordTask {
  const rule = RULES[kind]
  const [a, b, c] = draw(rule, min ?? 1, max, random)
  const p = pick(random, PEOPLE)
  const q = pick(
    random,
    PEOPLE.filter((other) => other !== p),
  )
  const thing: Forms = pick(random, THINGS)
  const cast: Cast = { p, q, thing, n: (count) => counted(count, thing), many: thing[2] }
  const text = rule.tell(a, b, c, cast)
  const numbers = [a, b, c].slice(0, rule.uses).join(',')
  const drawn = picture === true ? SCENES[kind] : undefined
  if (picture === true && drawn === undefined) throw new RangeError(`'${kind}' has no picture`)
  const prompt = drawn === undefined ? { kind, text } : { kind, text, scene: drawn(a, b, c, cast) }
  const base = { pluginId: PLUGIN_ID, prompt } as const
  const shown = drawn === undefined ? '' : 'p'
  if (ask === 'plan') {
    if (!(kind in PLAN_OF)) throw new RangeError(`'${kind}' has no plan to ask`)
    return {
      ...base,
      itemKey: `plan${shown}:${kind}:${numbers}`,
      prompt: { ...base.prompt, ask: 'plan' },
      answer: choiceAnswer(PLAN_OF[kind as keyof typeof PLAN_OF], PLANS),
    }
  }
  return {
    ...base,
    itemKey: `w${shown}:${kind}:${numbers}`,
    prompt: { ...base.prompt, ask: 'answer' },
    answer: numberAnswer(rule.answer(a, b, c), max),
  }
}

/** Three numbers from one to `max` that fit the rule, the biggest of them or the answer at least `min`. */
function draw(
  rule: Rule,
  min: number,
  max: number,
  random: Random,
): readonly [number, number, number] {
  for (let i = 0; i < TRIES; i++) {
    const a = randomInt(random, 1, max)
    const b = randomInt(random, 1, max)
    const c = randomInt(random, 1, max)
    const used = [a, b, c].slice(0, rule.uses)
    const big = Math.max(...used, rule.answer(a, b, c))
    if (rule.fits(a, b, c, max) && big >= min) return [a, b, c]
  }
  throw new RangeError(`No numbers up to ${String(max)} fit this problem`)
}
