import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { CATEGORIES, generateSort } from './generate'
import type { SortKnobs } from './knobs'
import { sortPlugin } from './plugin'

const SAMPLES = 500

function sample(knobs: SortKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateSort(knobs, random))
}

describe('generateSort', () => {
  it('category: the right words are exactly those of the asked kind', () => {
    const wrong = sample({ by: 'category' }).filter(({ prompt, answer }) => {
      if (prompt.by !== 'category') return true
      const kind = CATEGORIES.find((c) => c.asked === prompt.asked)
      const right = answer.options
        .filter((o) => kind?.words.includes(o.value) === true)
        .map((o) => o.value)
      return (
        right.join() !== answer.expected.join() ||
        right.length < 2 ||
        right.length === answer.options.length
      )
    })
    expect(wrong).toEqual([])
  })

  it('two features: the right shapes have both, and each feature alone is a trap', () => {
    const wrong = sample({ by: 'two-features' }).filter(({ prompt, answer }) => {
      if (prompt.by !== 'two-features') return true
      const { asked, figures } = prompt
      const right = figures
        .map((f, i) => (f.shape === asked.shape && f.colour === asked.colour ? String(i + 1) : ''))
        .filter(Boolean)
      const shapeOnly = figures.some((f) => f.shape === asked.shape && f.colour !== asked.colour)
      const colourOnly = figures.some((f) => f.colour === asked.colour && f.shape !== asked.shape)
      return right.join() !== answer.expected.join() || !shapeOnly || !colourOnly
    })
    expect(wrong).toEqual([])
  })
})

describe('sortPlugin', () => {
  it('asks aloud', () => {
    const task = sortPlugin.generateTyped({ by: 'two-features' }, createRandom(2))
    expect(sortPlugin.speak(task)).toMatch(
      /^Выбери все (красные|синие|зелёные) (круги|квадраты|треугольники)\.$/,
    )
  })

  it.each([{ by: 'colour' }, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => sortPlugin.generate(knobs, createRandom(1))).toThrow(/sort/)
  })
})
