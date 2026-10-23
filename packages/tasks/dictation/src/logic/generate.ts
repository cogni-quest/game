import {
  cellAnswer,
  pick,
  randomInt,
  type Cell,
  type CellAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { DictationKnobs } from './knobs'

export type Direction =
  'up' | 'down' | 'left' | 'right' | 'up-right' | 'up-left' | 'down-right' | 'down-left'

/** One dictated step: «две клетки вправо». */
export interface Move {
  readonly direction: Direction
  readonly count: number
}

export interface DictationPrompt {
  /** Cells to a side. */
  readonly size: number
  /** The marked cell: where the steps begin, or — when the start is asked — where they end. */
  readonly marked: Cell
  readonly moves: readonly Move[]
  readonly ask: 'end' | 'start'
}

export type DictationAnswer = CellAnswer
export type DictationTask = Task<DictationPrompt, DictationAnswer>

export const PLUGIN_ID = 'dictation'

export function isDictationTask(task: Task): task is DictationTask {
  return task.pluginId === PLUGIN_ID
}

/** Rows grow downwards, columns to the right. */
export const DELTA: Record<Direction, readonly [row: number, column: number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  'up-right': [-1, 1],
  'up-left': [-1, -1],
  'down-right': [1, 1],
  'down-left': [1, -1],
}

const STRAIGHT: readonly Direction[] = ['up', 'down', 'left', 'right']
const ALL: readonly Direction[] = Object.keys(DELTA) as Direction[]

/** Paths are drawn again until one fits; the odds are good, so this is never reached. */
const TRIES = 2_000

/** Every cell the moves pass from `start`, one by one, both ends included. */
export function walk(start: Cell, moves: readonly Move[]): readonly Cell[] {
  const cells: Cell[] = [start]
  let { row, column } = start
  for (const { direction, count } of moves) {
    const [dr, dc] = DELTA[direction]
    for (let i = 0; i < count; i++) {
      row += dr
      column += dc
      cells.push({ row, column })
    }
  }
  return cells
}

const key = ({ row, column }: Cell) => `${String(row)}.${String(column)}`

/** Same way or straight back: two such steps in a row would read as one, or undo each other. */
function turns(from: Direction, to: Direction): boolean {
  const [a, b] = DELTA[from]
  const [c, d] = DELTA[to]
  return !(a === c && b === d) && !(a === -c && b === -d)
}

export function generateDictation(knobs: DictationKnobs, random: Random): DictationTask {
  const { size, steps, longest, diagonal, cross } = knobs
  const ask = knobs.ask ?? 'end'
  const directions = diagonal === true ? ALL : STRAIGHT
  const inside = (n: number) => n >= 0 && n < size

  for (let t = 0; t < TRIES; t++) {
    const start = { row: randomInt(random, 0, size - 1), column: randomInt(random, 0, size - 1) }
    const moves: Move[] = []
    const seen = new Set([key(start)])
    let here = start
    for (let s = 0; s < steps; s++) {
      const last = moves.at(-1)?.direction
      const options: Move[] = []
      for (const direction of directions) {
        if (last !== undefined && !turns(last, direction)) continue
        const [dr, dc] = DELTA[direction]
        for (let count = 1; count <= longest; count++) {
          const run = Array.from({ length: count }, (_, i) => ({
            row: here.row + dr * (i + 1),
            column: here.column + dc * (i + 1),
          }))
          if (!run.every((c) => inside(c.row) && inside(c.column))) break
          if (cross !== true && run.some((c) => seen.has(key(c)))) break
          options.push({ direction, count })
        }
      }
      if (options.length === 0) break
      const move = pick(random, options)
      const cells = walk(here, [move])
      for (const c of cells) seen.add(key(c))
      here = cells.at(-1) ?? here
      moves.push(move)
    }
    if (moves.length < steps) continue

    const path = walk(start, moves)
    const end = path.at(-1) ?? start
    if (key(end) === key(start)) continue
    if (cross === true && new Set(path.map(key)).size === path.length) continue

    const marked = ask === 'end' ? start : end
    const expected = ask === 'end' ? end : start
    return {
      pluginId: PLUGIN_ID,
      itemKey: `dictation:${String(size)}:${ask}:${key(start)}:${moves.map(encode).join(',')}`,
      prompt: { size, marked, moves, ask },
      answer: cellAnswer(expected, size, size),
    }
  }
  throw new RangeError(
    `No ${String(steps)}-step path fits a ${String(size)} × ${String(size)} grid`,
  )
}

const LETTERS: Record<Direction, string> = {
  up: 'U',
  down: 'D',
  left: 'L',
  right: 'R',
  'up-right': 'UR',
  'up-left': 'UL',
  'down-right': 'DR',
  'down-left': 'DL',
}

/** «R2» for two cells to the right. */
function encode({ direction, count }: Move): string {
  return `${LETTERS[direction]}${String(count)}`
}
