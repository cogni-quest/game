import { createRandom, isNumberAnswer, isPickAnswer } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateBonds, type BondsTask } from './generate'
import type { BondsKnobs } from './knobs'
import { bondsPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: BondsKnobs) {
  const random = createRandom(9)
  return Array.from({ length: SAMPLES }, () => generateBonds(knobs, random))
}

/** Puts the answer into the box and checks the house or the line holds. */
function holds({ prompt, answer }: BondsTask): boolean {
  if (!isNumberAnswer(answer) || prompt.show === 'pairs') return false
  const fill = (n: number | 'blank') => (n === 'blank' ? answer.expected : n)
  if (prompt.show === 'house') {
    const [a, b] = prompt.parts
    return fill(a) + fill(b) === prompt.whole && fill(a) >= 1 && fill(b) >= 1
  }
  // `n = a + b` or `a ± b = n`
  const [x, first, y, second, z] = prompt.tokens.map((t) =>
    typeof t === 'number' || t === 'blank' ? fill(t) : t,
  )
  const apply = (a: unknown, op: unknown, b: unknown) =>
    typeof a === 'number' && typeof b === 'number' ? (op === '+' ? a + b : a - b) : NaN
  return first === '=' ? x === apply(y, second, z) : apply(x, first, y) === z
}

describe('generateBonds', () => {
  it.each<BondsKnobs>([
    { form: 'house', min: 2, max: 5 },
    { form: 'house', min: 10, max: 10 },
    { form: 'tens', min: 11, max: 19 },
    { form: 'ten-plus', min: 11, max: 19 },
    { form: 'minus-ones', min: 11, max: 19 },
    { form: 'minus-ten', min: 11, max: 19 },
  ])('the answer fills the box: %j', (knobs) => {
    const wrong = sample(knobs).filter((t) => !holds(t))
    expect(wrong).toEqual([])
  })

  it('empties either part of the house', () => {
    const empty = new Set(
      sample({ form: 'house', min: 6, max: 9 }).map((t) =>
        t.prompt.show === 'house' ? t.prompt.parts.indexOf('blank') : -1,
      ),
    )
    expect(empty).toEqual(new Set([0, 1]))
  })

  it('reaches every whole of the range', () => {
    const wholes = new Set(
      sample({ form: 'house', min: 6, max: 9 }).map((t) =>
        t.prompt.show === 'house' ? t.prompt.whole : 0,
      ),
    )
    expect(wholes).toEqual(new Set([6, 7, 8, 9]))
  })
})

describe('places', () => {
  /** The line read as `whole = parts…`, `whole = □ дес.` or `a − b = □`, with the answer put in. */
  function value({ prompt, answer }: BondsTask): [number, number] {
    if (prompt.show !== 'line') return [0, 1]
    const t = prompt.tokens.map((x) => (x === 'blank' ? answer.expected : x))
    if (t.includes('tens')) return [t[0] as number, (t[2] as number) * 10]
    if (t.includes('hundreds')) return [t[0] as number, (t[2] as number) * 100]
    if (t[1] === '−') return [(t[0] as number) - (t[2] as number), t[4] as number]
    const parts = t.slice(2).filter((x) => typeof x === 'number')
    return [t[0] as number, parts.reduce((a, b) => a + b, 0)]
  }

  it.each<BondsKnobs>([
    { form: 'count-tens', min: 10, max: 90 },
    { form: 'count-hundreds', min: 100, max: 900 },
    { form: 'expand', min: 21, max: 99 },
    { form: 'expand', min: 101, max: 999 },
    { form: 'drop', min: 21, max: 99 },
  ])('the answer makes the line true: %j', (knobs) => {
    const wrong = sample(knobs).filter((t) => {
      const [left, right] = value(t)
      return left !== right || !isNumberAnswer(t.answer) || t.answer.expected < 1
    })
    expect(wrong).toEqual([])
  })

  it('expands every place of a three-digit number, none of them zero', () => {
    const wrong = sample({ form: 'expand', min: 101, max: 999 }).filter(
      (t) => t.prompt.show === 'line' && t.prompt.tokens.length !== 7,
    )
    expect(wrong).toEqual([])
  })
})

describe('all pairs', () => {
  it('asks to press exactly the sums that make the whole', () => {
    const wrong = sample({ form: 'all-pairs', min: 3, max: 10 }).filter(({ prompt, answer }) => {
      if (prompt.show !== 'pairs' || !isPickAnswer(answer)) return true
      const makes = answer.options
        .filter((o) => o.value.split('+').reduce((s, n) => s + Number(n), 0) === prompt.whole)
        .map((o) => o.value)
      return makes.join() !== answer.expected.join() || makes.length === answer.options.length
    })
    expect(wrong).toEqual([])
  })
})

describe('bondsPlugin', () => {
  it('asks the question aloud', () => {
    const task = bondsPlugin.generateTyped({ form: 'minus-ten', min: 17, max: 17 }, createRandom(1))
    expect(bondsPlugin.speak(task)).toBe('17 минус 10 равно сколько?')
  })

  it.each([
    { form: 'house', min: 2, max: 12 },
    { form: 'tens', min: 5, max: 15 },
    { form: 'house', min: 6, max: 5 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => bondsPlugin.generate(knobs, createRandom(1))).toThrow(/bonds/)
  })
})
