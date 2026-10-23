import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateUnits, type Part } from './generate'
import type { PairId, UnitsKnobs } from './knobs'
import { unitsPlugin } from './plugin'
import { named, PAIRS } from './units'

const SAMPLES = 1_000

function sample(knobs: UnitsKnobs) {
  const random = createRandom(8)
  return Array.from({ length: SAMPLES }, () => generateUnits(knobs, random))
}

/** Both sides in the small unit, with the answer put into the blank. */
function sides(
  left: readonly Part[],
  right: readonly Part[],
  answer: unknown,
  pair: PairId = 'dm-cm',
) {
  const { ratio } = PAIRS[pair]
  const value = (parts: readonly Part[]) =>
    parts.reduce(
      (sum, { count, unit }) =>
        sum + (count === 'blank' ? (answer as number) : count) * (unit === 'big' ? ratio : 1),
      0,
    )
  return [value(left), value(right)]
}

describe('generateUnits', () => {
  it.each(['whole', 'compound', 'split'] as const)(
    '%s: the answer makes both sides equal, within the range',
    (form) => {
      const wrong = sample({ pair: 'dm-cm', form, max: 20 }).filter(({ prompt, answer }) => {
        const [left, right] = sides(prompt.left, prompt.right, answer.expected)
        return left !== right || (left ?? 0) > 20
      })
      expect(wrong).toEqual([])
    },
  )

  it('asks whole units both ways round', () => {
    const asked = new Set(sample({ pair: 'dm-cm', form: 'whole', max: 20 }).map((t) => t.itemKey))
    expect(asked).toEqual(new Set(['dm-cm:1>', 'dm-cm:2>', 'dm-cm:10<', 'dm-cm:20<']))
  })

  it('never mixes in a round amount, which would leave nothing of the small unit', () => {
    const amounts = new Set(
      sample({ pair: 'dm-cm', form: 'compound', max: 20 }).map((t) => t.answer.expected),
    )
    expect(amounts).toEqual(new Set([11, 12, 13, 14, 15, 16, 17, 18, 19]))
  })
})

describe('every pair', () => {
  const CASES: [PairId, number][] = [
    ['m-dm', 30],
    ['m-cm', 300],
    ['cm-mm', 30],
    ['rub-kop', 500],
    ['h-min', 180],
    ['day-h', 72],
    ['year-month', 36],
    ['kg-g', 5000],
    ['dm2-cm2', 300],
    ['m2-dm2', 300],
  ]

  it.each(
    CASES.flatMap(([pair, max]) =>
      (['whole', 'compound', 'split'] as const).map((form) => ({ pair, form, max })),
    ),
  )('$pair $form: the answer makes both sides equal, within the range', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const [left, right] = sides(prompt.left, prompt.right, answer.expected, knobs.pair)
      return left !== right || (left ?? 0) > knobs.max
    })
    expect(wrong).toEqual([])
  })

  it.each(['compare-whole', 'compare'] as const)(
    '%s names the relation of the two sides',
    (form) => {
      const tasks = sample({ pair: 'm-dm', form, max: 30 })
      const wrong = tasks.filter(({ prompt, answer }) => {
        const [left = 0, right = 0] = sides(prompt.left, prompt.right, 0, 'm-dm')
        const relation = left > right ? 'greater' : left < right ? 'less' : 'equal'
        return answer.expected !== relation || prompt.sign !== '□'
      })
      expect(wrong).toEqual([])
      expect(new Set(tasks.map((t) => t.answer.expected))).toEqual(
        new Set(['greater', 'less', 'equal']),
      )
    },
  )
})

describe('unitsPlugin', () => {
  it('reads the question aloud with the right word endings', () => {
    const split = unitsPlugin.generateTyped(
      { pair: 'dm-cm', form: 'split', max: 20 },
      createRandom(1),
    )
    const total = split.prompt.left[0]?.count
    expect(unitsPlugin.speak(split)).toBe(
      `${String(total)} сантиметров — это 1 дециметр и сколько сантиметров?`,
    )
  })

  it.each([
    [1, '1 дециметр'],
    [2, '2 дециметра'],
    [5, '5 дециметров'],
    [11, '11 дециметров'],
    [21, '21 дециметр'],
    [24, '24 дециметра'],
  ])('names %i', (count, said) => {
    expect(named(count, PAIRS['dm-cm'].big)).toBe(said)
  })

  it.each([
    { pair: 'km-m', form: 'whole', max: 20 },
    { pair: 'dm-cm', form: 'whole', max: 5 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => unitsPlugin.generate(knobs, createRandom(1))).toThrow(/units/)
  })
})
