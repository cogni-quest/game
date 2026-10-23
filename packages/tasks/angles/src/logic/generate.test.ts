import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateAngles } from './generate'
import type { AnglesKnobs } from './knobs'
import { anglesPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: AnglesKnobs) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generateAngles(knobs, random))
}

const far = (d: number) => (d >= 30 && d <= 60) || (d >= 120 && d <= 150)
const near = (d: number) => (d >= 70 && d <= 80) || (d >= 100 && d <= 110)

describe('generateAngles', () => {
  it('says «да» exactly when the angle is right, and both happen', () => {
    const tasks = sample({ ask: 'is-right' })
    const wrong = tasks.filter(
      ({ prompt, answer }) =>
        prompt.angles.length !== 1 ||
        answer.expected !== (prompt.angles[0]?.degrees === 90 ? 'yes' : 'no'),
    )
    expect(wrong).toEqual([])
    expect(new Set(tasks.map((t) => t.answer.expected))).toEqual(new Set(['yes', 'no']))
  })

  it.each([
    [{ ask: 'which' } as const, far],
    [{ ask: 'which', near: true } as const, near],
  ])('%j: exactly one right angle, and it is the answer', (knobs, fits) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const right = prompt.angles.flatMap((a, i) => (a.degrees === 90 ? [String(i + 1)] : []))
      const others = prompt.angles.filter((a) => a.degrees !== 90)
      return (
        prompt.angles.length !== 3 ||
        right.length !== 1 ||
        answer.expected !== right[0] ||
        others.some((a) => !fits(a.degrees))
      )
    })
    expect(wrong).toEqual([])
  })

  it('puts the right angle in every place', () => {
    const places = new Set(sample({ ask: 'which' }).map((t) => t.answer.expected))
    expect(places).toEqual(new Set(['1', '2', '3']))
  })

  it('offers options once each', () => {
    const tasks = [...sample({ ask: 'which' }), ...sample({ ask: 'is-right', near: true })]
    expect(
      tasks.every(
        (t) => new Set(t.answer.options.map((o) => o.value)).size === t.answer.options.length,
      ),
    ).toBe(true)
  })

  it('keeps the wrong angles close to right with `near`', () => {
    const wrong = sample({ ask: 'is-right', near: true }).filter(
      ({ prompt }) => prompt.angles[0]?.degrees !== 90 && !near(prompt.angles[0]?.degrees ?? 0),
    )
    expect(wrong).toEqual([])
  })
})

describe('anglesPlugin', () => {
  it('asks the question aloud', () => {
    const task = anglesPlugin.generateTyped({ ask: 'which' }, createRandom(1))
    expect(anglesPlugin.speak(task)).toBe('Какой угол прямой?')
  })

  it.each([{ ask: 'acute' }, { ask: 'which', near: false }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => anglesPlugin.generate(knobs, createRandom(1))).toThrow(/angles/)
    },
  )
})
