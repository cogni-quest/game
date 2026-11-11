import type { AnswerSpec } from '../task'
import { checkBoard, onBoard, type Cell } from './cell'

/**
 * A cell of an order, and — when the colour is part of what is asked — the
 * colour it was in: «верхний угол, красный».
 */
export interface OrderedCell extends Cell {
  readonly colour?: string
}

/**
 * Several cells of a board, pressed one after another in a set order — the
 * shared building block for «повтори, в каком порядке загорелись огоньки».
 * Right means the same cells in the same order, and in the same colours when
 * the order has them: the same cells in another order is a miss, because the
 * order is what is asked.
 *
 * The board is the plugin's to draw; the core knows only its size.
 */
export interface CellOrderAnswer extends AnswerSpec<readonly OrderedCell[]> {
  readonly shape: 'cell-order'
  readonly rows: number
  readonly columns: number
}

export function isCellOrderAnswer(answer: AnswerSpec<unknown>): answer is CellOrderAnswer {
  return answer.shape === 'cell-order'
}

const same = (a: OrderedCell, b: OrderedCell) =>
  a.row === b.row && a.column === b.column && (a.colour ?? null) === (b.colour ?? null)

/**
 * Where the given order first parts from the right one: the index of the first
 * wrong press — wrong cell or wrong colour — the length of the shorter one
 * when one stops early, or null when they agree. What a view marks after a
 * miss — «ошибка на третьем».
 */
export function firstMistake(
  expected: readonly OrderedCell[],
  given: readonly OrderedCell[],
): number | null {
  const shorter = Math.min(expected.length, given.length)
  for (let i = 0; i < shorter; i++) {
    const want = expected[i]
    const got = given[i]
    if (!want || !got || !same(want, got)) return i
  }
  return expected.length === given.length ? null : shorter
}

export function cellOrderAnswer(
  expected: readonly OrderedCell[],
  rows: number,
  columns: number,
): CellOrderAnswer {
  checkBoard(rows, columns)
  if (expected.length === 0) throw new RangeError('An order needs at least one cell')
  const off = expected.find((cell) => !onBoard(cell, rows, columns))
  if (off) {
    throw new RangeError(
      `The cell ${String(off.row)}.${String(off.column)} of the order is off the board`,
    )
  }
  const coloured = expected.filter((cell) => cell.colour !== undefined).length
  if (coloured !== 0 && coloured !== expected.length) {
    throw new RangeError('Either every cell of an order has a colour, or none has')
  }
  return {
    shape: 'cell-order',
    expected,
    rows,
    columns,
    isCorrect: (given) => Array.isArray(given) && firstMistake(expected, given) === null,
  }
}
