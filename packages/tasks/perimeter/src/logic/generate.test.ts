import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generatePerimeter, HEIGHT, WIDTH } from './generate'
import type { Figure, PerimeterKnobs } from './knobs'
import { perimeterPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: PerimeterKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generatePerimeter(knobs, random))
}

const FIGURES: readonly [Figure, number, number][] = [
  ['broken-line', 3, 4],
  ['triangle', 3, 3],
  ['quadrilateral', 4, 4],
  ['rectangle', 4, 4],
  ['square', 4, 4],
]

describe('generatePerimeter', () => {
  it.each(FIGURES)(
    '%s: the answer is the sum of all sides, within the range, drawn inside the picture',
    (figure, sideCount, pointCount) => {
      const wrong = sample({ figure, max: 20 }).filter(
        ({ prompt, answer }) =>
          prompt.sides.length !== sideCount ||
          prompt.points.length !== pointCount ||
          answer.expected !== prompt.sides.reduce((s, n) => s + n, 0) ||
          answer.expected > 20 ||
          prompt.sides.some((n) => n < 2) ||
          prompt.points.some((p) => p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT),
      )
      expect(wrong).toEqual([])
    },
  )

  it('signs two neighbouring sides of a rectangle and one of a square, the rest are equal to them', () => {
    const rectangle = sample({ figure: 'rectangle', max: 30 })
    expect(
      rectangle.every(({ prompt: { sides, signed } }) => {
        const [a, b, c, d] = sides
        return signed.join() === '0,1' && a === c && b === d && a !== b
      }),
    ).toBe(true)
    const square = sample({ figure: 'square', max: 30 })
    expect(
      square.every(
        ({ prompt: { sides, signed } }) => signed.join() === '0' && new Set(sides).size === 1,
      ),
    ).toBe(true)
  })

  it('draws a triangle that can exist', () => {
    const wrong = sample({ figure: 'triangle', max: 30 }).filter(({ prompt }) => {
      const [a = 0, b = 0, c = 0] = prompt.sides
      return a + b <= c || b + c <= a || a + c <= b
    })
    expect(wrong).toEqual([])
  })

  it('reaches larger numbers with a larger range', () => {
    const totals = sample({ figure: 'quadrilateral', max: 100 }).map((t) => t.answer.expected)
    expect(Math.max(...totals)).toBeGreaterThan(50)
  })
})

describe('perimeterPlugin', () => {
  it('asks the question aloud', () => {
    const line = perimeterPlugin.generateTyped({ figure: 'broken-line', max: 20 }, createRandom(1))
    expect(perimeterPlugin.speak(line)).toBe('Какая длина у ломаной?')
    const square = perimeterPlugin.generateTyped({ figure: 'square', max: 20 }, createRandom(1))
    expect(perimeterPlugin.speak(square)).toBe('Чему равен периметр?')
  })

  it.each([{ figure: 'circle', max: 20 }, { figure: 'square', max: 5 }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => perimeterPlugin.generate(knobs, createRandom(1))).toThrow(/perimeter/)
    },
  )
})
