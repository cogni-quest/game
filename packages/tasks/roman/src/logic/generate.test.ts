import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateRoman, toRoman } from './generate'
import { romanPlugin } from './plugin'

const SAMPLES = 1_000

function sample(max: number) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generateRoman({ max }, random))
}

const TABLE = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
  'XXI',
  'XXII',
  'XXIII',
  'XXIV',
  'XXV',
  'XXVI',
  'XXVII',
  'XXVIII',
  'XXIX',
  'XXX',
  'XXXI',
  'XXXII',
  'XXXIII',
  'XXXIV',
  'XXXV',
  'XXXVI',
  'XXXVII',
  'XXXVIII',
  'XXXIX',
  'XL',
]

describe('toRoman', () => {
  it('writes 1…40 with the subtractive forms', () => {
    expect(Array.from({ length: 40 }, (_, i) => toRoman(i + 1))).toEqual(TABLE)
  })
})

describe('generateRoman', () => {
  it.each([10, 20, 40])('up to %i: the numeral is the answer, within range', (max) => {
    const wrong = sample(max).filter(
      ({ prompt, answer }) =>
        prompt.numeral !== toRoman(answer.expected) || answer.expected < 1 || answer.expected > max,
    )
    expect(wrong).toEqual([])
  })

  it.each([
    [20, 10],
    [40, 20],
  ])('up to %i: most numerals are above %i, the rest still come', (max, below) => {
    const numbers = sample(max).map((t) => t.answer.expected)
    const above = numbers.filter((n) => n > below).length
    expect(above / SAMPLES).toBeGreaterThan(0.6)
    expect(Math.min(...numbers)).toBe(1)
    expect(Math.max(...numbers)).toBe(max)
  })
})

describe('romanPlugin', () => {
  it.each([{ max: 50 }, { max: 3 }, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => romanPlugin.generate(knobs, createRandom(1))).toThrow(/roman/)
  })
})
