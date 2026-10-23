import {
  chance,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { Kind, SudokuKnobs } from './knobs'

/** A given number, an empty cell, or the empty cell that is asked. */
export type Cell = number | 'blank' | 'asked'

export interface SudokuPrompt {
  readonly kind: Kind
  /** Cells per side: 4 for a sudoku, 3 for a magic square. */
  readonly size: number
  /** Row by row. */
  readonly cells: readonly Cell[]
}

export type SudokuTask = Task<SudokuPrompt, NumberAnswer>

export const PLUGIN_ID = 'sudoku'

export function isSudokuTask(task: Task): task is SudokuTask {
  return task.pluginId === PLUGIN_ID
}

/** Every row, column and diagonal of a magic square adds up to this. */
export const MAGIC_SUM = 15

const SUDOKU_SIZE = 4
const MAGIC_SIZE = 3

/** A full 4×4 sudoku; every other one is this one relabelled and reshuffled. */
const BASE_SUDOKU = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1] as const

/** The Lo Shu square; the other seven magic squares of 1–9 are its turns and mirrors. */
const LO_SHU = [2, 7, 6, 9, 5, 1, 4, 3, 8] as const

/** Bounded, though no draw is ever refused: three blanks cannot hide two solutions. */
const TRIES = 100

export function generateSudoku(knobs: SudokuKnobs, random: Random): SudokuTask {
  const size = knobs.kind === 'sudoku' ? SUDOKU_SIZE : MAGIC_SIZE
  const full = knobs.kind === 'sudoku' ? fullSudoku(random) : fullMagic(random)
  for (let i = 0; i < TRIES; i++) {
    const empty =
      knobs.kind === 'sudoku'
        ? sudokuBlanks(knobs.blanks, random)
        : anyCells(9, knobs.blanks, random)
    const asked = empty[randomInt(random, 0, empty.length - 1)] ?? 0
    const cells: Cell[] = full.map((n, at) =>
      at === asked ? 'asked' : empty.includes(at) ? 'blank' : n,
    )
    if (solutions(knobs.kind, cells).length !== 1) continue
    return {
      pluginId: PLUGIN_ID,
      itemKey: `sud:${knobs.kind}:${keyOf(cells, size)}`,
      prompt: { kind: knobs.kind, size, cells },
      answer: numberAnswer(full[asked] ?? 0, knobs.kind === 'sudoku' ? SUDOKU_SIZE : 9),
    }
  }
  throw new RangeError('No puzzle with a single solution was found')
}

/** Rows joined by «/», blanks as «.», the asked cell as «?». */
function keyOf(cells: readonly Cell[], size: number): string {
  const marks = cells.map((c) => (c === 'asked' ? '?' : c === 'blank' ? '.' : String(c)))
  const rows: string[] = []
  for (let r = 0; r < size; r++) rows.push(marks.slice(r * size, (r + 1) * size).join(''))
  return rows.join('/')
}

function shuffled<T>(items: readonly T[], random: Random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = out[i]
    const b = out[j]
    if (a !== undefined && b !== undefined) {
      out[i] = b
      out[j] = a
    }
  }
  return out
}

/** The order of rows (or columns): the two bands either way, each band's two lines either way. */
function lineOrder(random: Random): number[] {
  const bands = chance(random, 0.5) ? [0, 1] : [1, 0]
  return bands.flatMap((band) =>
    chance(random, 0.5) ? [band * 2, band * 2 + 1] : [band * 2 + 1, band * 2],
  )
}

/** The base sudoku with its digits relabelled, rows and columns shuffled within the rules, maybe transposed. */
function fullSudoku(random: Random): number[] {
  const digits = shuffled([1, 2, 3, 4], random)
  const rows = lineOrder(random)
  const columns = lineOrder(random)
  const transpose = chance(random, 0.5)
  const grid: number[] = []
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      const [sr, sc] = transpose ? [columns[c] ?? 0, rows[r] ?? 0] : [rows[r] ?? 0, columns[c] ?? 0]
      grid.push(digits[(BASE_SUDOKU[sr * SUDOKU_SIZE + sc] ?? 1) - 1] ?? 1)
    }
  }
  return grid
}

/** One of the eight turns and mirrors of the Lo Shu square. */
function fullMagic(random: Random): number[] {
  let grid: number[] = [...LO_SHU]
  const turns = randomInt(random, 0, 3)
  for (let t = 0; t < turns; t++) {
    // A quarter turn: the new row r, column c is the old row 2 − c, column r.
    grid = grid.map((_, at) => grid[(2 - (at % 3)) * 3 + Math.floor(at / 3)] ?? 0)
  }
  if (chance(random, 0.5))
    grid = grid.map((_, at) => grid[Math.floor(at / 3) * 3 + (2 - (at % 3))] ?? 0)
  return grid
}

/** One cell; two side by side in one row; or three anywhere. */
function sudokuBlanks(blanks: 1 | 2 | 3, random: Random): number[] {
  if (blanks === 2) {
    const row = randomInt(random, 0, SUDOKU_SIZE - 1)
    const column = randomInt(random, 0, SUDOKU_SIZE - 2)
    return [row * SUDOKU_SIZE + column, row * SUDOKU_SIZE + column + 1]
  }
  return anyCells(SUDOKU_SIZE * SUDOKU_SIZE, blanks, random)
}

function anyCells(count: number, blanks: number, random: Random): number[] {
  return shuffled(
    Array.from({ length: count }, (_, i) => i),
    random,
  ).slice(0, blanks)
}

/** The lines whose numbers may not repeat (sudoku) or must add up (magic square). */
function linesOf(kind: Kind): readonly (readonly number[])[] {
  const size = kind === 'sudoku' ? SUDOKU_SIZE : MAGIC_SIZE
  const indices = Array.from({ length: size }, (_, i) => i)
  const rows = indices.map((r) => indices.map((c) => r * size + c))
  const columns = indices.map((c) => indices.map((r) => r * size + c))
  if (kind === 'sudoku') {
    const boxes = [0, 2, 8, 10].map((corner) => [corner, corner + 1, corner + 4, corner + 5])
    return [...rows, ...columns, ...boxes]
  }
  return [...rows, ...columns, [0, 4, 8], [2, 4, 6]]
}

/**
 * Every way to fill the empty cells that keeps the rules: in a sudoku each line
 * holds 1–4 once; in a magic square the numbers 1–9 are each used once and every
 * line adds up to 15.
 */
export function solutions(kind: Kind, cells: readonly Cell[]): number[][] {
  const empty = cells.flatMap((c, at) => (typeof c === 'number' ? [] : [at]))
  const values = kind === 'sudoku' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const lines = linesOf(kind)
  const found: number[][] = []
  const grid = cells.map((c) => (typeof c === 'number' ? c : 0))
  const fill = (k: number) => {
    if (k === empty.length) {
      if (fits(kind, grid, lines)) found.push([...grid])
      return
    }
    const at = empty[k] ?? 0
    for (const v of values) {
      grid[at] = v
      fill(k + 1)
    }
    grid[at] = 0
  }
  fill(0)
  return found
}

function fits(kind: Kind, grid: readonly number[], lines: readonly (readonly number[])[]): boolean {
  if (kind === 'sudoku') {
    return lines.every((line) => new Set(line.map((at) => grid[at])).size === line.length)
  }
  return (
    new Set(grid).size === grid.length &&
    lines.every((line) => line.reduce((sum, at) => sum + (grid[at] ?? 0), 0) === MAGIC_SUM)
  )
}
