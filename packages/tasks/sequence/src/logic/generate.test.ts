import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateSequence, type SequenceTask } from './generate'
import type { SequenceKnobs } from './knobs'
import { sequencePlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: SequenceKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateSequence(knobs, random))
}

/** The row with the answer put into the box. */
function filled({ prompt, answer }: SequenceTask): number[] {
  return prompt.terms.map((t) => (t === 'blank' ? answer.expected : t))
}

const steps = (numbers: readonly number[]) => numbers.slice(1).map((n, i) => n - (numbers[i] ?? 0))

describe('generateSequence', () => {
  it.each<[SequenceKnobs, number]>([
    [{ ask: 'next', step: 1 }, 20],
    [{ ask: 'next', step: 2 }, 20],
    [{ ask: 'next', step: 5 }, 50],
    [{ ask: 'next', step: 10 }, 100],
    [{ ask: 'gap', step: 1 }, 20],
    [{ ask: 'gap', step: 2 }, 20],
    [{ ask: 'gap', step: 5 }, 50],
    [{ ask: 'gap', step: 10 }, 100],
  ])('%j keeps one step throughout, from 0 to %i', (knobs, limit) => {
    const step = knobs.step as number
    const wrong = sample(knobs).filter((task) => {
      const numbers = filled(task)
      const gaps = new Set(steps(numbers).map(Math.abs))
      return (
        gaps.size !== 1 ||
        !gaps.has(step) ||
        numbers.some((n) => n < 0 || n > limit) ||
        task.prompt.terms.filter((t) => t === 'blank').length !== 1
      )
    })
    expect(wrong).toEqual([])
  })

  it('goes down as well as up with small steps, and only up with 5 and 10', () => {
    const direction = (knobs: SequenceKnobs) =>
      new Set(sample(knobs).map((t) => Math.sign(steps(filled(t))[0] ?? 0)))
    expect(direction({ ask: 'next', step: 1 })).toEqual(new Set([1, -1]))
    expect(direction({ ask: 'gap', step: 2 })).toEqual(new Set([1, -1]))
    expect(direction({ ask: 'next', step: 5 })).toEqual(new Set([1]))
    expect(direction({ ask: 'next', step: 10 })).toEqual(new Set([1]))
  })

  it('starts fives and tens from a multiple of the step', () => {
    const wrong = [...sample({ ask: 'next', step: 5 }), ...sample({ ask: 'gap', step: 10 })].filter(
      (t) => {
        const [first = 0, second = 0] = filled(t)
        return first % (second - first) !== 0
      },
    )
    expect(wrong).toEqual([])
  })

  it('a growing step grows by one each time', () => {
    const wrong = sample({ ask: 'next', step: 'growing' }).filter((task) => {
      const gaps = steps(filled(task))
      return gaps.some((g, i) => g !== i + 1) || (filled(task)[0] ?? 0) > 5
    })
    expect(wrong).toEqual([])
  })

  it('shows four or five numbers before the next one, and the gap in the middle', () => {
    const next = sample({ ask: 'next', step: 2 })
    expect(new Set(next.map((t) => t.prompt.terms.length))).toEqual(new Set([5, 6]))
    expect(next.every((t) => t.prompt.terms.at(-1) === 'blank')).toBe(true)
    const gap = new Set(sample({ ask: 'gap', step: 1 }).map((t) => t.prompt.terms.indexOf('blank')))
    expect(gap).toEqual(new Set([1, 2, 3]))
  })
})

describe('sequencePlugin', () => {
  it('asks the question aloud', () => {
    const task = sequencePlugin.generateTyped({ ask: 'gap', step: 10 }, createRandom(1))
    expect(sequencePlugin.speak(task)).toMatch(/^Какое число пропущено: (\d+|…)(, (\d+|…)){4}\?$/)
  })

  it.each([{ ask: 'gap', step: 'growing' }, { ask: 'next', step: 3 }, { ask: 'next' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => sequencePlugin.generate(knobs, createRandom(1))).toThrow(/sequence/)
    },
  )
})
