import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateMissing } from './generate'
import type { Blank } from './knobs'
import { missingPlugin } from './plugin'

const SAMPLES = 1_000

function sample(blank: Blank, max = 10) {
  const random = createRandom(10)
  return Array.from({ length: SAMPLES }, () => generateMissing({ blank, max }, random))
}

describe('generateMissing', () => {
  it.each<[Blank, string]>([
    ['second', 'a+□=c'],
    ['first', '□+b=c'],
    ['subtrahend', 'a−□=c'],
  ])('%s: the answer fills the box, every number within 1…10', (blank) => {
    const wrong = sample(blank).filter(({ prompt, answer }) => {
      const [x, op, y, , z] = prompt.tokens.map((t) => (t === 'blank' ? answer.expected : t))
      const numbers = [x, y, z].filter((n) => typeof n === 'number')
      const holds =
        typeof x === 'number' && typeof y === 'number' && (op === '+' ? x + y : x - y) === z
      return !holds || numbers.length !== 3 || numbers.some((n) => n < 1 || n > 10)
    })
    expect(wrong).toEqual([])
  })

  it('puts the box where the section says', () => {
    const at = (blank: Blank) => new Set(sample(blank).map((t) => t.prompt.tokens.indexOf('blank')))
    expect([at('first'), at('second'), at('subtrahend')]).toEqual([
      new Set([0]),
      new Set([2]),
      new Set([2]),
    ])
  })
})

describe('equations', () => {
  it('minuend: x − b = a, within the range', () => {
    const random = createRandom(4)
    const wrong = Array.from({ length: SAMPLES }, () =>
      generateMissing({ blank: 'minuend', max: 100, letter: true }, random),
    ).filter(({ prompt, answer, itemKey }) => {
      const [, , b, , a] = prompt.tokens
      return (
        answer.expected - (b as number) !== a ||
        answer.expected > 100 ||
        !itemKey.startsWith('miss:x−')
      )
    })
    expect(wrong).toEqual([])
  })

  it('factor: by × x = product, the other factor 2…10', () => {
    const random = createRandom(4)
    const wrong = Array.from({ length: SAMPLES }, () =>
      generateMissing({ blank: 'factor', max: 10, by: 3 }, random),
    ).filter(({ prompt, answer }) => {
      const [by, , , , product] = prompt.tokens
      return by !== 3 || 3 * answer.expected !== product || answer.expected < 2
    })
    expect(wrong).toEqual([])
  })
})

describe('missingPlugin', () => {
  it('asks the question aloud', () => {
    const task = missingPlugin.generateTyped({ blank: 'first', max: 10 }, createRandom(1))
    expect(missingPlugin.speak(task)).toMatch(/^сколько плюс \d+ равно \d+\?$/)
  })

  it.each([
    { blank: 'third', max: 10 },
    { blank: 'first', max: 2 },
    { blank: 'factor', max: 10 },
    { blank: 'first', max: 10, by: 3 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => missingPlugin.generate(knobs, createRandom(1))).toThrow(/missing/)
  })
})
