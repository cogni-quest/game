import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateDifference } from './generate'
import type { DifferenceKnobs } from './knobs'
import { differencePlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: DifferenceKnobs) {
  const random = createRandom(12)
  return Array.from({ length: SAMPLES }, () => generateDifference(knobs, random))
}

describe('generateDifference', () => {
  it.each<DifferenceKnobs>([
    { show: 'picture', max: 5 },
    { show: 'number', max: 10 },
  ])('the answer is the gap, both sides within 1…max: %j', (knobs) => {
    const wrong = sample(knobs).filter(
      ({ prompt: { red, blue }, answer }) =>
        answer.expected !== Math.abs(red - blue) ||
        answer.expected < 1 ||
        Math.min(red, blue) < 1 ||
        Math.max(red, blue) > knobs.max,
    )
    expect(wrong).toEqual([])
  })

  it('asks both ways, with either colour the bigger', () => {
    const tasks = sample({ show: 'picture', max: 10 })
    expect(new Set(tasks.map((t) => t.prompt.ask))).toEqual(new Set(['more', 'less']))
    expect(new Set(tasks.map((t) => t.prompt.red > t.prompt.blue))).toEqual(new Set([true, false]))
  })
})

describe('differencePlugin', () => {
  it('asks «больше» of the bigger side and «меньше» of the smaller', () => {
    const said = sample({ show: 'number', max: 10 })
      .slice(0, 50)
      .map((task) => {
        const big = Math.max(task.prompt.red, task.prompt.blue)
        const small = Math.min(task.prompt.red, task.prompt.blue)
        const expected =
          task.prompt.ask === 'more'
            ? `На сколько ${String(big)} больше, чем ${String(small)}?`
            : `На сколько ${String(small)} меньше, чем ${String(big)}?`
        return differencePlugin.speak(task) === expected
      })
    expect(said.every(Boolean)).toBe(true)
  })

  it.each([{ show: 'picture', max: 12 }, { show: 'words', max: 10 }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => differencePlugin.generate(knobs, createRandom(1))).toThrow(/difference/)
    },
  )
})
