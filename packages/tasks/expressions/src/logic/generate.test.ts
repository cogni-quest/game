import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateExpressions, type Side } from './generate'
import type { ExpressionsKnobs } from './knobs'
import { expressionsPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: ExpressionsKnobs) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generateExpressions(knobs, random))
}

/** Works a side out on its own. */
function evaluate(side: Side): number {
  const [a, op, b] = side
  if (op === undefined || b === undefined) return a
  return op === '+' ? a + b : a - b
}

describe('generateExpressions', () => {
  it.each<ExpressionsKnobs>([
    { sides: 'number-expression', max: 20 },
    { sides: 'expressions', max: 20 },
    { sides: 'expressions', max: 100 },
    { sides: 'same-term', max: 20 },
    { sides: 'same-term', max: 100 },
  ])('names the relation, every number and value within 0…max: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt: { left, right }, answer }) => {
      const [l, r] = [evaluate(left), evaluate(right)]
      const expected = l > r ? 'greater' : l < r ? 'less' : 'equal'
      const numbers = [...left, ...right].filter((t) => typeof t === 'number')
      return (
        answer.expected !== expected ||
        [l, r].some((v) => v < 0 || v > knobs.max) ||
        numbers.some((n) => n < 0 || n > knobs.max)
      )
    })
    expect(wrong).toEqual([])
  })

  it('puts the number on either side, and sometimes the sides are equal', () => {
    const tasks = sample({ sides: 'number-expression', max: 20 })
    expect(new Set(tasks.map((t) => t.prompt.left.length))).toEqual(new Set([1, 3]))
    const equal = tasks.filter((t) => t.answer.expected === 'equal').length
    expect(equal).toBeGreaterThan(SAMPLES / 8)
    expect(equal).toBeLessThan(SAMPLES / 2)
  })

  it('«не вычисляя»: the first term and sign the same, the other within five, never equal', () => {
    const wrong = sample({ sides: 'same-term', max: 100 }).filter(({ prompt, answer }) => {
      const [a, op, b] = prompt.left
      const [c, op2, d] = prompt.right
      return (
        a !== c ||
        op !== op2 ||
        b === undefined ||
        d === undefined ||
        Math.abs(b - d) < 1 ||
        Math.abs(b - d) > 5 ||
        answer.expected === 'equal'
      )
    })
    expect(wrong).toEqual([])
  })

  it('offers all three words every time', () => {
    const task = generateExpressions({ sides: 'expressions', max: 20 }, createRandom(1))
    expect(task.answer.options.map((o) => o.label)).toEqual(['> больше', '< меньше', '= равно'])
  })
})

describe('expressionsPlugin', () => {
  it('reads both sides aloud', () => {
    const task = expressionsPlugin.generateTyped(
      { sides: 'number-expression', max: 20 },
      createRandom(3),
    )
    expect(expressionsPlugin.speak(task)).toMatch(
      /^Сравни: \d+( (плюс|минус) \d+)? и \d+( (плюс|минус) \d+)?$/,
    )
  })

  it.each([{ sides: 'numbers', max: 20 }, { sides: 'expressions', max: 5 }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => expressionsPlugin.generate(knobs, createRandom(1))).toThrow(/expressions/)
    },
  )
})
