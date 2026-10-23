import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateNumberLine } from './generate'
import type { NumberLineKnobs } from './knobs'
import { numberLinePlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: NumberLineKnobs) {
  const random = createRandom(13)
  return Array.from({ length: SAMPLES }, () => generateNumberLine(knobs, random))
}

describe('generateNumberLine', () => {
  it('points between the ends and never signs the answer', () => {
    const wrong = sample({ min: 0, max: 20, labels: 'all' }).filter(
      ({ prompt, answer }) =>
        answer.expected !== prompt.arrow ||
        prompt.arrow <= 0 ||
        prompt.arrow >= 20 ||
        prompt.signed.includes(prompt.arrow),
    )
    expect(wrong).toEqual([])
  })

  it.each<[NumberLineKnobs['labels'], (n: number) => boolean]>([
    ['all', () => true],
    ['every-2', (n) => n % 2 === 0],
    ['ends', (n) => n === 10 || n === 20],
  ])('signs %s', (labels, signs) => {
    const wrong = sample({ min: 10, max: 20, labels }).filter(({ prompt }) => {
      const expected = Array.from({ length: 11 }, (_, i) => 10 + i).filter(
        (n) => signs(n) && n !== prompt.arrow,
      )
      return prompt.signed.join() !== expected.join()
    })
    expect(wrong).toEqual([])
  })
})

describe('steps and tens', () => {
  it('puts marks every step and the arrow on a mark', () => {
    const wrong = sample({ min: 0, max: 100, step: 10, labels: 'every-2' }).filter(
      ({ prompt }) => prompt.arrow % 10 !== 0 || prompt.signed.some((n) => n % 20 !== 0),
    )
    expect(wrong).toEqual([])
  })

  it('signs only the whole tens with `tens`', () => {
    const wrong = sample({ min: 40, max: 60, labels: 'tens' }).filter(
      ({ prompt }) =>
        prompt.signed.join() !== [40, 50, 60].filter((n) => n !== prompt.arrow).join(),
    )
    expect(wrong).toEqual([])
  })
})

describe('numberLinePlugin', () => {
  it.each([{ min: 0, max: 30, labels: 'all' }, { min: 0, max: 20, labels: 'some' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => numberLinePlugin.generate(knobs, createRandom(1))).toThrow(/number-line/)
    },
  )
})
