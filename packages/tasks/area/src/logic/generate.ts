import {
  chance,
  choiceAnswer,
  numberAnswer,
  randomInt,
  type ChoiceAnswer,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { AreaKnobs } from './knobs'

/** A grid cell: its column and row, from the top left. */
export type Cell = readonly [column: number, row: number]

export type AreaPrompt =
  | { readonly ask: 'compare'; readonly left: readonly Cell[]; readonly right: readonly Cell[] }
  | { readonly ask: 'cells'; readonly cells: readonly Cell[] }
  | { readonly ask: 'sides'; readonly width: number; readonly height: number }

export type Side = 'left' | 'right'
export type AreaAnswer = NumberAnswer | ChoiceAnswer<Side>
export type AreaTask = Task<AreaPrompt, AreaAnswer>

export const PLUGIN_ID = 'area'

export function isAreaTask(task: Task): task is AreaTask {
  return task.pluginId === PLUGIN_ID
}

/** The grid a `cells` figure lies on, and the one each `compare` figure lies on. */
export const GRID = { columns: 8, rows: 6 } as const
export const COMPARE_GRID = { columns: 6, rows: 6 } as const

const MAX_CELLS = 30
const FAR = 3
const TRIES = 10_000

const SIDES = [
  { value: 'left', label: 'левая' },
  { value: 'right', label: 'правая' },
] as const

export function generateArea(knobs: AreaKnobs, random: Random): AreaTask {
  switch (knobs.ask) {
    case 'sides': {
      const width = randomInt(random, 2, knobs.max)
      const height = randomInt(random, 2, knobs.max)
      return {
        pluginId: PLUGIN_ID,
        itemKey: `area:sides:${String(width)}x${String(height)}`,
        prompt: { ask: 'sides', width, height },
        answer: numberAnswer(width * height, knobs.max * knobs.max),
      }
    }
    case 'cells': {
      const cells =
        knobs.shape === 'rectangle'
          ? rectangle(randomInt(random, 2, 6), randomInt(random, 2, 5), 0, 0)
          : composite(random, GRID)
      const placed = place(cells, GRID, random)
      return {
        pluginId: PLUGIN_ID,
        itemKey: `area:cells:${key(cells)}`,
        prompt: { ask: 'cells', cells: placed },
        answer: numberAnswer(cells.length, MAX_CELLS),
      }
    }
    case 'compare': {
      const [left, right] = comparePair(knobs.near === true, random)
      return {
        pluginId: PLUGIN_ID,
        itemKey: `area:compare:${key(left)}/${key(right)}`,
        prompt: {
          ask: 'compare',
          left: place(left, COMPARE_GRID, random),
          right: place(right, COMPARE_GRID, random),
        },
        answer: choiceAnswer<Side>(left.length > right.length ? 'left' : 'right', SIDES),
      }
    }
  }
}

function rectangle(width: number, height: number, column: number, row: number): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) cells.push([column + c, row + r])
  return cells
}

/** An L or a T: a rectangle with a second one stuck to its right side. */
function composite(random: Random, grid: { columns: number; rows: number }): Cell[] {
  for (let i = 0; i < TRIES; i++) {
    const w1 = randomInt(random, 1, grid.columns - 2)
    const h1 = randomInt(random, 2, grid.rows)
    const w2 = randomInt(random, 1, grid.columns - w1)
    const h2 = randomInt(random, 1, grid.rows)
    const row = randomInt(random, 0, grid.rows - h2)
    // The second rectangle must touch the first along at least one cell.
    if (row >= h1) continue
    const cells = unique([...rectangle(w1, h1, 0, 0), ...rectangle(w2, h2, w1, row)])
    if (!isRectangle(cells) && cells.length <= MAX_CELLS && fits(cells, grid))
      return normalise(cells)
  }
  throw new RangeError('No composite figure fits the grid')
}

/** Two figures whose areas differ by one (`near`) or by three or more. */
function comparePair(near: boolean, random: Random): readonly [Cell[], Cell[]] {
  const figure = () =>
    chance(random, 0.5)
      ? rectangle(randomInt(random, 2, 5), randomInt(random, 2, 5), 0, 0)
      : composite(random, COMPARE_GRID)
  for (let i = 0; i < TRIES; i++) {
    const a = figure()
    const b = figure()
    if (a.length < 4 || b.length < 4 || a.length > 20 || b.length > 20) continue
    const gap = Math.abs(a.length - b.length)
    if (near) {
      const [big, small] = a.length > b.length ? [a, b] : [b, a]
      if (gap === 1 && box(big) <= box(small)) return [a, b]
    } else if (gap >= FAR) {
      return [a, b]
    }
  }
  throw new RangeError('No pair of figures fits')
}

/** Moves a figure to a random spot on the grid where it fits. */
function place(
  cells: readonly Cell[],
  grid: { columns: number; rows: number },
  random: Random,
): Cell[] {
  const width = Math.max(...cells.map(([c]) => c)) + 1
  const height = Math.max(...cells.map(([, r]) => r)) + 1
  const dc = randomInt(random, 0, grid.columns - width)
  const dr = randomInt(random, 0, grid.rows - height)
  return cells.map(([c, r]) => [c + dc, r + dr])
}

function unique(cells: readonly Cell[]): Cell[] {
  const seen = new Map(cells.map((cell) => [`${String(cell[0])},${String(cell[1])}`, cell]))
  return [...seen.values()]
}

function normalise(cells: readonly Cell[]): Cell[] {
  const left = Math.min(...cells.map(([c]) => c))
  const top = Math.min(...cells.map(([, r]) => r))
  return cells.map(([c, r]) => [c - left, r - top])
}

/** The area of the smallest rectangle around the figure. */
function box(cells: readonly Cell[]): number {
  const columns = cells.map(([c]) => c)
  const rows = cells.map(([, r]) => r)
  return (
    (Math.max(...columns) - Math.min(...columns) + 1) * (Math.max(...rows) - Math.min(...rows) + 1)
  )
}

function isRectangle(cells: readonly Cell[]): boolean {
  return box(cells) === cells.length
}

function fits(cells: readonly Cell[], grid: { columns: number; rows: number }): boolean {
  return cells.every(([c, r]) => c >= 0 && r >= 0 && c < grid.columns && r < grid.rows)
}

/** The figure's cells in reading order, so the same figure always has the same key. */
function key(cells: readonly Cell[]): string {
  return [...cells]
    .sort(([c1, r1], [c2, r2]) => (r1 === r2 ? c1 - c2 : r1 - r2))
    .map(([c, r]) => `${String(c)}.${String(r)}`)
    .join(';')
}
