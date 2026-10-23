import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateWord, type SceneRow } from './generate'
import type { Kind, WordKnobs } from './knobs'
import { wordPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: WordKnobs) {
  const random = createRandom(14)
  return Array.from({ length: SAMPLES }, () => generateWord(knobs, random))
}

/** The numbers of a problem, as the itemKey records them. */
function numbersOf(itemKey: string): number[] {
  return (itemKey.split(':')[2] ?? '').split(',').map(Number)
}

const SOLVE: Record<Kind, (n: readonly number[]) => number> = {
  sum: ([a = 0, b = 0]) => a + b,
  take: ([a = 0, b = 0]) => a - b,
  gained: ([a = 0, b = 0]) => b - a,
  'more-by': ([a = 0, b = 0]) => a + b,
  'less-by': ([a = 0, b = 0]) => a - b,
  difference: ([a = 0, b = 0]) => Math.abs(a - b),
  increase: ([a = 0, b = 0]) => a + b,
  decrease: ([a = 0, b = 0]) => a - b,
  'sum-take': ([a = 0, b = 0, c = 0]) => a + b - c,
  'take-sum': ([a = 0, b = 0, c = 0]) => a - b + c,
  'more-by-sum': ([a = 0, b = 0]) => 2 * a + b,
  mult: ([a = 0, b = 0]) => a * b,
  share: ([a = 0]) => a,
  cost: ([a = 0, b = 0]) => a * b,
  price: ([a = 0]) => a,
  quantity: ([, b = 0]) => b,
  'times-more': ([a = 0, b = 0]) => a * b,
  'times-less': ([a = 0]) => a,
  'times-ratio': ([, b = 0]) => b,
  'times-increase': ([a = 0, b = 0]) => a * b,
  'times-decrease': ([a = 0]) => a,
  queue: ([a = 0, b = 0]) => a + b - 1,
  'age-gap': ([a = 0]) => a,
  'age-later': ([a = 0, b = 0, c = 0]) => b + c - a,
}

/** The multiplying kinds, which tell products rather than the drawn numbers. */
const MULTIPLYING = new Set<Kind>([
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
])

describe('generateWord', () => {
  it.each(Object.keys(SOLVE) as Kind[])(
    '%s: the answer solves it, from 1 up to max, and the story names its numbers',
    (kind) => {
      const max = MULTIPLYING.has(kind) ? 100 : 10
      const wrong = sample({ kind, max }).filter(({ itemKey, prompt, answer }) => {
        const numbers = numbersOf(itemKey)
        const told = numbers
          .filter((_, i) => kind !== 'difference' || i < 2)
          .filter(() => !MULTIPLYING.has(kind))
          .every((n) => prompt.text.includes(String(n)))
        return (
          answer.expected !== SOLVE[kind](numbers) ||
          answer.expected < 1 ||
          answer.expected > max ||
          !told
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it('never tells «было 1 …», so the verb never has to agree with one', () => {
    const tasks = (['sum', 'take', 'gained', 'sum-take', 'take-sum'] as const).flatMap((kind) =>
      sample({ kind, max: 10 }),
    )
    expect(tasks.filter((t) => /(было|дали ещё|стало|Потом) 1 /.test(t.prompt.text))).toEqual([])
  })

  it('reads well', () => {
    const task = generateWord({ kind: 'take', max: 10 }, createRandom(3))
    expect(task.prompt.text).toMatch(
      /^У [А-Я][а-я]+ было \d+ [а-я]+\. \d+ [а-я]+ (он отдал|она отдала) [А-Я][а-я]+\. Сколько [а-я]+ осталось у [А-Я][а-я]+\?$/,
    )
  })

  it('asks the plan of a two-step problem', () => {
    const plans = new Set(
      (['sum-take', 'take-sum', 'more-by-sum'] as const).map(
        (kind) => generateWord({ kind, max: 10, ask: 'plan' }, createRandom(1)).answer.expected,
      ),
    )
    expect(plans).toEqual(new Set(['add-take', 'take-add', 'add-add']))
  })
})

describe('pictures', () => {
  /** The counters a picture shows, row by row, the ones taken away included. */
  const counters = (scene: readonly SceneRow[] | undefined) =>
    (scene ?? []).map((row) =>
      row.parts.reduce((sum, part) => sum + (part.count === 'unknown' ? 0 : part.count), 0),
    )

  it.each([
    ['sum', ([a = 0, b = 0]: number[]) => [a + b]],
    ['take', ([a = 0]: number[]) => [a]],
    ['more-by', ([a = 0, b = 0]: number[]) => [a, a + b]],
    ['difference', ([a = 0, b = 0]: number[]) => [a, b]],
    ['take-sum', ([a = 0, , c = 0]: number[]) => [a + c]],
  ] as const)('%s draws the counters the story tells', (kind, rows) => {
    const wrong = sample({ kind, max: 10, picture: true }).filter(
      ({ itemKey, prompt }) =>
        counters(prompt.scene).join() !== rows(numbersOf(itemKey)).join() ||
        !itemKey.startsWith('wp:'),
    )
    expect(wrong).toEqual([])
  })

  it('draws only stories of counters up to 20', () => {
    expect(() =>
      wordPlugin.generate({ kind: 'mult', max: 10, picture: true }, createRandom(1)),
    ).toThrow(/word/)
    expect(() =>
      wordPlugin.generate({ kind: 'sum', max: 50, picture: true }, createRandom(1)),
    ).toThrow(/word/)
  })

  it('tells a queue with the ordinal that fits the child', () => {
    const text = sample({ kind: 'queue', max: 10 })[0]?.prompt.text ?? ''
    expect(text).toMatch(/^[А-Я][а-я]+ стоит в очереди \d+-[яй] с начала и \d+-[яй] с конца\./)
  })
})

describe('wordPlugin', () => {
  it.each([{ kind: 'sum', max: 10, ask: 'plan' }, { kind: 'divide', max: 10 }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => wordPlugin.generate(knobs, createRandom(1))).toThrow(/word/)
    },
  )
})
