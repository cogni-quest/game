import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateRuler } from './generate'
import type { RulerKnobs } from './knobs'
import { rulerPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: RulerKnobs) {
  const random = createRandom(6)
  return Array.from({ length: SAMPLES }, () => generateRuler(knobs, random))
}

describe('generateRuler', () => {
  it.each<RulerKnobs>([
    { min: 2, max: 10, from: 'zero' },
    { min: 11, max: 15, from: 'zero' },
    { min: 2, max: 15, from: 'any' },
  ])('asks the length of a strip that lies on the ruler: %j', (knobs) => {
    const wrong = sample(knobs).filter(
      ({ prompt, answer }) =>
        answer.expected !== prompt.length ||
        prompt.length < knobs.min ||
        prompt.start + prompt.length > prompt.ruler ||
        prompt.ruler !== knobs.max,
    )
    expect(wrong).toEqual([])
  })

  it('starts at zero, or never at zero', () => {
    const fromZero = new Set(sample({ min: 2, max: 10, from: 'zero' }).map((t) => t.prompt.start))
    expect(fromZero).toEqual(new Set([0]))
    const starts = sample({ min: 2, max: 15, from: 'any' }).map((t) => t.prompt.start)
    expect(Math.min(...starts)).toBe(1)
  })

  it('reaches both ends of the lengths', () => {
    const lengths = sample({ min: 2, max: 10, from: 'zero' }).map((t) => t.answer.expected)
    expect([Math.min(...lengths), Math.max(...lengths)]).toEqual([2, 10])
  })
})

describe('rulerPlugin', () => {
  it.each([{ min: 11, max: 10, from: 'zero' }, { min: 2, max: 30, from: 'zero' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => rulerPlugin.generate(knobs, createRandom(1))).toThrow(/ruler/)
    },
  )
})
