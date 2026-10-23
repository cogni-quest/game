import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateSudoku, MAGIC_SUM, solutions } from './generate'
import type { SudokuKnobs } from './knobs'
import { sudokuPlugin } from './plugin'

const SAMPLES = 300

function sample(knobs: SudokuKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateSudoku(knobs, random))
}

const KNOBS: SudokuKnobs[] = [
  { kind: 'sudoku', blanks: 1 },
  { kind: 'sudoku', blanks: 2 },
  { kind: 'sudoku', blanks: 3 },
  { kind: 'magic', blanks: 1 },
  { kind: 'magic', blanks: 2 },
]

describe('generateSudoku', () => {
  it.each(KNOBS)('has exactly one solution, and the answer is its asked cell: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const found = solutions(prompt.kind, prompt.cells)
      const asked = prompt.cells.indexOf('asked')
      const empty = prompt.cells.filter((c) => typeof c !== 'number').length
      return found.length !== 1 || found[0]?.[asked] !== answer.expected || empty !== knobs.blanks
    })
    expect(wrong).toEqual([])
  })

  it('fills a sudoku with 1–4 once in every row, column and box', () => {
    const wrong = sample({ kind: 'sudoku', blanks: 3 }).filter(({ prompt }) => {
      const grid = solutions('sudoku', prompt.cells)[0] ?? []
      const at = (r: number, c: number) => grid[r * 4 + c]
      const groups = [0, 1, 2, 3].flatMap((i) => [
        [0, 1, 2, 3].map((j) => at(i, j)),
        [0, 1, 2, 3].map((j) => at(j, i)),
        [0, 1, 2, 3].map((j) =>
          at(Math.floor(i / 2) * 2 + Math.floor(j / 2), (i % 2) * 2 + (j % 2)),
        ),
      ])
      return groups.some((g) => [...g].sort().join() !== '1,2,3,4')
    })
    expect(wrong).toEqual([])
  })

  it('reshuffles the sudoku and turns the magic square', () => {
    const grids = (knobs: SudokuKnobs) =>
      new Set(
        sample(knobs).map(({ prompt, answer }) =>
          prompt.cells.map((c) => (typeof c === 'number' ? c : answer.expected)).join(),
        ),
      )
    expect(grids({ kind: 'sudoku', blanks: 1 }).size).toBeGreaterThan(20)
    expect(grids({ kind: 'magic', blanks: 1 }).size).toBe(8)
  })

  it('makes every line of a magic square add up to 15', () => {
    const wrong = sample({ kind: 'magic', blanks: 2 }).filter(({ prompt }) => {
      const g = solutions('magic', prompt.cells)[0] ?? []
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ]
      return lines.some((l) => l.reduce((s, at) => s + (g[at] ?? 0), 0) !== MAGIC_SUM)
    })
    expect(wrong).toEqual([])
  })

  it('puts two sudoku blanks side by side in one row', () => {
    const wrong = sample({ kind: 'sudoku', blanks: 2 }).filter(({ prompt }) => {
      const empty = prompt.cells.flatMap((c, at) => (typeof c === 'number' ? [] : [at]))
      const [a = 0, b = 0] = empty
      return b - a !== 1 || Math.floor(a / 4) !== Math.floor(b / 4)
    })
    expect(wrong).toEqual([])
  })

  it('keys each puzzle by its grid, the asked cell as «?»', () => {
    const task = generateSudoku({ kind: 'magic', blanks: 1 }, createRandom(1))
    expect(task.itemKey).toMatch(/^sud:magic:[1-9?]{3}\/[1-9?]{3}\/[1-9?]{3}$/)
  })
})

describe('sudokuPlugin', () => {
  it('asks the question aloud, with the sum for a magic square', () => {
    const task = sudokuPlugin.generateTyped({ kind: 'magic', blanks: 1 }, createRandom(1))
    expect(sudokuPlugin.speak(task)).toBe(
      'В каждой строке, столбце и диагонали сумма 15. Какое число должно стоять в клетке со знаком вопроса?',
    )
  })

  it.each([
    { kind: 'sudoku', blanks: 4 },
    { kind: 'magic', blanks: 3 },
    { kind: 'kakuro', blanks: 1 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => sudokuPlugin.generate(knobs, createRandom(1))).toThrow(/sudoku/)
  })
})
