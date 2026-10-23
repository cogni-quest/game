import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateTimes, type TimesTask } from './generate'
import type { TimesKnobs } from './knobs'
import { timesPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: TimesKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateTimes(knobs, random))
}

/** `a op b`: the two numbers and the sign, read off the tokens. */
function parts({ prompt }: TimesTask): readonly [number, string, number] {
  const [a, op, b] = prompt.tokens
  if (typeof a !== 'number' || typeof b !== 'number' || typeof op !== 'string') {
    throw new Error(`not an example: ${prompt.tokens.join(' ')}`)
  }
  return [a, op, b]
}

const ALL: TimesKnobs[] = [
  ...[2, 3, 4, 5, 6, 7, 8, 9].flatMap((by): TimesKnobs[] => [
    { kind: 'table-mul', by },
    { kind: 'table-div', by },
    { kind: 'skip', by },
  ]),
  ...(
    [
      'by-1',
      'by-0',
      'by-10',
      'div-1',
      'self',
      'zero-div',
      'div-10',
      'round-mul',
      'two-digit-mul',
      'round-div',
      'round-by-round',
      'sum-div',
      'guess-div',
      'div-by-10',
    ] as const
  ).map((kind): TimesKnobs => ({ kind })),
  { kind: 'times-10-100', by: 10 },
  { kind: 'times-10-100', by: 100 },
]

describe('generateTimes', () => {
  it.each(ALL.filter((k) => k.kind !== 'skip'))(
    'the answer is the product or the exact quotient: %j',
    (knobs) => {
      const wrong = sample(knobs).filter((task) => {
        const [a, op, b] = parts(task)
        const right = op === '×' ? a * b : a / b
        return (
          !Number.isInteger(right) ||
          task.answer.expected !== right ||
          task.answer.upTo < right ||
          task.prompt.tokens.at(-1) !== 'blank'
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it.each<[TimesKnobs, (a: number, b: number, answer: number) => boolean]>([
    [
      { kind: 'table-mul', by: 7 },
      (a, b) => (a === 7 || b === 7) && a >= 7 && b >= 7 && a * b <= 63,
    ],
    [{ kind: 'table-div', by: 7 }, (_, b, q) => b === 7 && q >= 2 && q <= 9],
    [{ kind: 'round-mul' }, (a, b) => a % 10 === 0 && b >= 2 && b <= 9 && a * b <= 100],
    [{ kind: 'two-digit-mul' }, (a, b) => a % 10 !== 0 && a > 10 && b <= 9 && a * b <= 100],
    [{ kind: 'round-div' }, (a, b, q) => a % 10 === 0 && b <= 9 && q % 10 === 0],
    [{ kind: 'round-by-round' }, (a, b) => a % 10 === 0 && b % 10 === 0 && b >= 20],
    [{ kind: 'sum-div' }, (a, b, q) => a % 10 !== 0 && a < 100 && b <= 9 && q >= 11],
    [{ kind: 'guess-div' }, (a, b, q) => b > 10 && b % 10 !== 0 && q >= 2 && q <= 9 && a <= 100],
    [{ kind: 'times-10-100', by: 10 }, (a, b) => b === 10 && a >= 11 && a <= 99],
    [{ kind: 'times-10-100', by: 100 }, (a, b) => b === 100 && a >= 2 && a <= 9],
    [{ kind: 'div-by-10' }, (_, b, q) => b === 10 && q >= 11 && q <= 99],
  ])('keeps %j within its range', (knobs, fits) => {
    const wrong = sample(knobs).filter((task) => {
      const [a, , b] = parts(task)
      return !fits(a, b, task.answer.expected)
    })
    expect(wrong).toEqual([])
  })

  it('skips by the same step, and the box holds the missing term', () => {
    const wrong = sample({ kind: 'skip', by: 3 }).filter(({ prompt, answer }) => {
      const row = prompt.tokens
        .filter((t) => t !== ',')
        .map((t) => (t === 'blank' ? answer.expected : t))
      return row.some((n, i) => i > 0 && n !== (row[i - 1] as number) + 3) || row.length < 4
    })
    expect(wrong).toEqual([])
  })

  it('never lets two kinds ask the same example', () => {
    const owner = new Map<string, string>()
    const clashes: string[] = []
    for (const knobs of ALL) {
      const name = JSON.stringify(knobs)
      for (const key of new Set(sample(knobs).map((t) => t.itemKey))) {
        const other = owner.get(key)
        if (other !== undefined && other !== name) clashes.push(`${key}: ${other} and ${name}`)
        owner.set(key, name)
      }
    }
    expect(clashes).toEqual([])
  })
})

describe('timesPlugin', () => {
  it('asks the question aloud', () => {
    const task = timesPlugin.generateTyped({ kind: 'div-10' }, createRandom(1))
    const [a] = parts(task)
    expect(timesPlugin.speak(task)).toBe(`Сколько будет ${String(a)} разделить на 10?`)
    const row = timesPlugin.generateTyped({ kind: 'skip', by: 2 }, createRandom(1))
    expect(timesPlugin.speak(row)).toMatch(/^Какое число пропущено: [\d…, ]+\?$/)
  })

  it.each([
    { kind: 'table-mul', by: 10 },
    { kind: 'by-1', by: 2 },
    { kind: 'times-10-100', by: 5 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => timesPlugin.generate(knobs, createRandom(1))).toThrow(/times/)
  })
})
