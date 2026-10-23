import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateLengthCompare } from './generate'
import type { LengthCompareKnobs } from './knobs'
import { lengthComparePlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: LengthCompareKnobs) {
  const random = createRandom(4)
  return Array.from({ length: SAMPLES }, () => generateLengthCompare(knobs, random))
}

describe('generateLengthCompare', () => {
  it.each<LengthCompareKnobs>([
    { ask: 'longer', gap: 'any' },
    { ask: 'shorter', gap: 'any' },
    { ask: 'longer', gap: 'any', shifted: true, equal: true },
  ])('names the strip that is asked for: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt: { red, blue }, answer }) => {
      const expected =
        red.length === blue.length
          ? 'same'
          : red.length > blue.length === (knobs.ask === 'longer')
            ? 'red'
            : 'blue'
      return answer.expected !== expected
    })
    expect(wrong).toEqual([])
  })

  it.each([
    ['far', (gap: number) => gap >= 4],
    ['near', (gap: number) => gap === 1],
  ] as const)('keeps %s strips at their distance, never equal', (gap, fits) => {
    const wrong = sample({ ask: 'longer', gap }).filter(
      ({ prompt }) => !fits(Math.abs(prompt.red.length - prompt.blue.length)),
    )
    expect(wrong).toEqual([])
  })

  it('gives both colours as the answer, so «the top one» is not a rule', () => {
    const answers = new Set(sample({ ask: 'shorter', gap: 'near' }).map((t) => t.answer.expected))
    expect(answers).toEqual(new Set(['red', 'blue']))
  })

  it('starts both strips at the edge unless they are shifted', () => {
    const starts = new Set(
      sample({ ask: 'longer', gap: 'any' }).map((t) => t.prompt.red.start + t.prompt.blue.start),
    )
    expect(starts).toEqual(new Set([0]))
  })

  it('shifts one strip, and sometimes the longer one does not reach further', () => {
    const tasks = sample({ ask: 'longer', gap: 'any', shifted: true })
    expect(tasks.every((t) => Math.min(t.prompt.red.start, t.prompt.blue.start) === 0)).toBe(true)
    const misleading = tasks.filter(({ prompt: { red, blue } }) => {
      const redEnd = red.start + red.length
      const blueEnd = blue.start + blue.length
      return red.length > blue.length !== redEnd > blueEnd
    })
    expect(misleading.length).toBeGreaterThan(0)
  })

  it('offers «одинаковые» only with `equal`, and then it is sometimes right', () => {
    expect(sample({ ask: 'longer', gap: 'any' })[0]?.answer.options).toHaveLength(2)
    const equal = sample({ ask: 'longer', gap: 'any', equal: true })
    expect(equal.every((t) => t.answer.options.length === 3)).toBe(true)
    expect(equal.some((t) => t.answer.expected === 'same')).toBe(true)
  })
})

describe('lengthComparePlugin', () => {
  it('asks the question aloud', () => {
    const task = lengthComparePlugin.generateTyped({ ask: 'shorter', gap: 'far' }, createRandom(1))
    expect(lengthComparePlugin.speak(task)).toBe('Какая полоска короче?')
  })

  it.each([{ ask: 'wider', gap: 'far' }, { ask: 'longer' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => lengthComparePlugin.generate(knobs, createRandom(1))).toThrow(/length-compare/)
    },
  )
})
