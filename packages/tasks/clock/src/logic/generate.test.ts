import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateClock, handAngles, written } from './generate'
import type { Step } from './knobs'
import { clockPlugin } from './plugin'

const SAMPLES = 1_000

function sample(step: Step) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generateClock({ step }, random))
}

describe('generateClock', () => {
  it.each<[Step, readonly number[]]>([
    ['hour', [0]],
    ['half', [30]],
    ['quarter', [15, 45]],
    ['five', [5, 10, 20, 25, 35, 40, 50, 55]],
  ])('%s: the shown time is the answer, from its own minutes', (step, minutes) => {
    const tasks = sample(step)
    const wrong = tasks.filter(
      ({ prompt, answer }) =>
        answer.expected !== written(prompt.hours, prompt.minutes) ||
        prompt.hours < 1 ||
        prompt.hours > 12,
    )
    expect(wrong).toEqual([])
    expect(new Set(tasks.map((t) => t.prompt.minutes))).toEqual(new Set(minutes))
  })

  it.each<Step>(['hour', 'half', 'quarter', 'five'])(
    '%s: three or four different times, the right one among them, all real times',
    (step) => {
      const wrong = sample(step).filter(({ answer }) => {
        const values = answer.options.map((o) => o.value)
        return (
          values.length < 3 ||
          values.length > 4 ||
          new Set(values).size !== values.length ||
          !values.includes(answer.expected) ||
          values.some((v) => {
            const [h = 0, m = -1] = v.split(':').map(Number)
            return h < 1 || h > 12 || m < 0 || m > 55 || m % 5 !== 0
          })
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it('moves the hour hand on between the numbers', () => {
    expect(handAngles({ hours: 3, minutes: 30 })).toEqual({ hour: 105, minute: 180 })
    expect(handAngles({ hours: 12, minutes: 0 })).toEqual({ hour: 0, minute: 0 })
  })
})

describe('clockPlugin', () => {
  it('asks the question aloud', () => {
    const task = clockPlugin.generateTyped({ step: 'half' }, createRandom(1))
    expect(clockPlugin.speak(task)).toBe('Который час?')
  })

  it.each([{ step: 'minute' }, {}, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => clockPlugin.generate(knobs, createRandom(1))).toThrow(/clock/)
  })
})
