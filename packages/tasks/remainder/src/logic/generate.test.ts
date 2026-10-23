import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateRemainder } from './generate'
import type { RemainderKnobs } from './knobs'
import { remainderPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: RemainderKnobs) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generateRemainder(knobs, random))
}

describe('generateRemainder', () => {
  it.each<RemainderKnobs>([
    { show: 'picture', max: 20 },
    { show: 'number', max: 50 },
    { show: 'number', max: 100, ask: 'remainder' },
  ])('divides with a remainder below the divisor, asking one part: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt: p, answer }) => {
      const asked = p.ask === 'quotient' ? p.quotient : p.remainder
      return (
        p.quotient * p.divisor + p.remainder !== p.dividend ||
        p.remainder < 1 ||
        p.remainder >= p.divisor ||
        p.quotient < 1 ||
        p.divisor < 2 ||
        p.divisor > 9 ||
        p.dividend > knobs.max ||
        answer.expected !== asked ||
        (knobs.ask !== undefined && p.ask !== knobs.ask)
      )
    })
    expect(wrong).toEqual([])
  })

  it('asks both parts when the section does not say which', () => {
    const asked = new Set(sample({ show: 'number', max: 20 }).map((t) => t.prompt.ask))
    expect(asked).toEqual(new Set(['quotient', 'remainder']))
  })

  it('keys the part asked and the picture apart', () => {
    const keys = new Set(
      [
        ...sample({ show: 'number', max: 20, ask: 'quotient' }),
        ...sample({ show: 'number', max: 20, ask: 'remainder' }),
        ...sample({ show: 'picture', max: 20, ask: 'quotient' }),
      ].map((t) => t.itemKey.replace(/^rem:\d+:\d+/, '')),
    )
    expect(keys).toEqual(new Set(['q', 'r', 'qp']))
  })
})

describe('remainderPlugin', () => {
  it('asks the question aloud', () => {
    const task = remainderPlugin.generateTyped(
      { show: 'number', max: 20, ask: 'remainder' },
      createRandom(1),
    )
    const { dividend, divisor } = task.prompt
    expect(remainderPlugin.speak(task)).toBe(
      `${String(dividend)} разделить на ${String(divisor)} с остатком. Какой остаток?`,
    )
    const picture = remainderPlugin.generateTyped(
      { show: 'picture', max: 20, ask: 'quotient' },
      createRandom(2),
    )
    expect(remainderPlugin.speak(picture)).toMatch(
      /^\d+ конфет(у|ы)? разложили по \d\. Сколько полных кучек\?$/,
    )
  })

  it.each([
    { show: 'picture', max: 30 },
    { show: 'number', max: 5 },
    { show: 'words', max: 20 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => remainderPlugin.generate(knobs, createRandom(1))).toThrow(/remainder/)
  })
})
