import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { COMPARE_GRID, generateArea, GRID, type Cell } from './generate'
import type { AreaKnobs } from './knobs'
import { areaPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: AreaKnobs) {
  const random = createRandom(17)
  return Array.from({ length: SAMPLES }, () => generateArea(knobs, random))
}

function box(cells: readonly Cell[]): number {
  const cs = cells.map(([c]) => c)
  const rs = cells.map(([, r]) => r)
  return (Math.max(...cs) - Math.min(...cs) + 1) * (Math.max(...rs) - Math.min(...rs) + 1)
}

const distinct = (cells: readonly Cell[]) =>
  new Set(cells.map(([c, r]) => `${String(c)},${String(r)}`)).size

const onGrid = (cells: readonly Cell[], grid: { columns: number; rows: number }) =>
  cells.every(([c, r]) => c >= 0 && r >= 0 && c < grid.columns && r < grid.rows)

describe('generateArea', () => {
  it.each(['rectangle', 'composite'] as const)(
    '%s: the answer is the number of cells, all on the grid, at most 30',
    (shape) => {
      const wrong = sample({ ask: 'cells', shape }).filter(({ prompt, answer }) => {
        if (prompt.ask !== 'cells') return true
        const isRectangle = box(prompt.cells) === prompt.cells.length
        return (
          answer.expected !== prompt.cells.length ||
          distinct(prompt.cells) !== prompt.cells.length ||
          !onGrid(prompt.cells, GRID) ||
          prompt.cells.length > 30 ||
          isRectangle !== (shape === 'rectangle')
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it('multiplies the two sides', () => {
    const wrong = sample({ ask: 'sides', max: 5 }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'sides' ||
        answer.expected !== prompt.width * prompt.height ||
        Math.min(prompt.width, prompt.height) < 2 ||
        Math.max(prompt.width, prompt.height) > 5,
    )
    expect(wrong).toEqual([])
  })

  it.each([
    [{ ask: 'compare' } as const, (gap: number) => gap >= 3],
    [{ ask: 'compare', near: true } as const, (gap: number) => gap === 1],
  ])('%j: names the bigger figure, never equal', (knobs, fits) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      if (prompt.ask !== 'compare') return true
      const { left, right } = prompt
      return (
        answer.expected !== (left.length > right.length ? 'left' : 'right') ||
        !fits(Math.abs(left.length - right.length)) ||
        !onGrid(left, COMPARE_GRID) ||
        !onGrid(right, COMPARE_GRID)
      )
    })
    expect(wrong).toEqual([])
  })

  it('makes the outline mislead when the figures are close', () => {
    const wrong = sample({ ask: 'compare', near: true }).filter(({ prompt }) => {
      if (prompt.ask !== 'compare') return true
      const [big, small] =
        prompt.left.length > prompt.right.length
          ? [prompt.left, prompt.right]
          : [prompt.right, prompt.left]
      return box(big) > box(small)
    })
    expect(wrong).toEqual([])
  })

  it('puts the bigger figure on both sides', () => {
    const answers = new Set(sample({ ask: 'compare' }).map((t) => t.answer.expected))
    expect(answers).toEqual(new Set(['left', 'right']))
  })
})

describe('areaPlugin', () => {
  it('asks the question aloud', () => {
    const task = areaPlugin.generateTyped({ ask: 'compare' }, createRandom(1))
    expect(areaPlugin.speak(task)).toBe('Какая фигура больше по площади?')
  })

  it.each([{ ask: 'sides', max: 12 }, { ask: 'cells', shape: 'circle' }, { ask: 'volume' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => areaPlugin.generate(knobs, createRandom(1))).toThrow(/area/)
    },
  )
})
