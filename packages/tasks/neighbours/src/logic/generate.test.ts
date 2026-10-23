import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateNeighbours, type Place } from './generate'
import type { Ask } from './knobs'
import { neighboursPlugin } from './plugin'

const SAMPLES = 1_000

function sample(ask: Ask, max = 10) {
  const random = createRandom(2)
  return Array.from({ length: SAMPLES }, () => generateNeighbours({ max, ask }, random))
}

describe('generateNeighbours', () => {
  it.each<[Ask, (shown: readonly Place[], answer: number) => boolean]>([
    ['next', (s, a) => s[0] === a - 1 && s[1] === 'blank'],
    ['previous', (s, a) => s[0] === 'blank' && s[1] === a + 1],
    ['between', (s, a) => s[0] === a - 1 && s[1] === 'blank' && s[2] === a + 1],
    ['skip-next', (s, a) => s[0] === a - 2 && s[1] === 'skip' && s[2] === 'blank'],
    ['skip-previous', (s, a) => s[0] === 'blank' && s[1] === 'skip' && s[2] === a + 2],
  ])('%s: the blank is the answer, every shown number within 0…10', (ask, fits) => {
    const wrong = sample(ask).filter(
      (t) =>
        !fits(t.prompt.shown, t.answer.expected) ||
        t.prompt.shown.some((n) => typeof n === 'number' && (n < 0 || n > 10)) ||
        t.answer.expected < 0 ||
        t.answer.expected > 10,
    )
    expect(wrong).toEqual([])
  })

  it('reaches both ends of the range', () => {
    const next = new Set(sample('next').map((t) => t.answer.expected))
    expect(Math.min(...next)).toBe(1)
    expect(Math.max(...next)).toBe(10)
    const previous = new Set(sample('previous').map((t) => t.answer.expected))
    expect(Math.min(...previous)).toBe(0)
  })
})

describe('neighboursPlugin', () => {
  it('asks the question aloud', () => {
    const task = neighboursPlugin.generateTyped({ max: 10, ask: 'between' }, createRandom(1))
    const n = task.answer.expected
    expect(neighboursPlugin.speak(task)).toBe(
      `Какое число между ${String(n - 1)} и ${String(n + 1)}?`,
    )
    const skip = neighboursPlugin.generateTyped({ max: 10, ask: 'skip-next' }, createRandom(1))
    expect(neighboursPlugin.speak(skip)).toBe(
      `Какое число стоит через одно после ${String(skip.answer.expected - 2)}?`,
    )
  })

  it.each([{ max: 4, ask: 'next' }, { max: 10, ask: 'after' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => neighboursPlugin.generate(knobs, createRandom(1))).toThrow(/neighbours/)
    },
  )
})
