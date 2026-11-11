import type { AnswerSpec } from '../task'

/** A cell of a board, counted from the top left corner. */
export interface Cell {
  readonly row: number
  readonly column: number
}

/**
 * One cell of a board, pointed at with one press — the shared building block
 * for «куда пришёл?» on a grid. The board is the plugin's to draw; the core
 * knows only its size, so an answer off the board is refused at once.
 */
export interface CellAnswer extends AnswerSpec<Cell> {
  readonly shape: 'cell'
  readonly rows: number
  readonly columns: number
}

export function isCellAnswer(answer: AnswerSpec<unknown>): answer is CellAnswer {
  return answer.shape === 'cell'
}

/** Throws unless the board has whole sides; shared by every answer on a board. */
export function checkBoard(rows: number, columns: number): void {
  const fits = (n: number) => Number.isInteger(n) && n >= 1
  if (!fits(rows) || !fits(columns)) {
    throw new RangeError(`A board has whole sides, not ${String(rows)} × ${String(columns)}`)
  }
}

/** Whether a cell is one of the board's. */
export function onBoard({ row, column }: Cell, rows: number, columns: number): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(column) &&
    row >= 0 &&
    row < rows &&
    column >= 0 &&
    column < columns
  )
}

export function cellAnswer(expected: Cell, rows: number, columns: number): CellAnswer {
  checkBoard(rows, columns)
  if (!onBoard(expected, rows, columns)) {
    throw new RangeError(
      `The right cell ${String(expected.row)}.${String(expected.column)} is off the board`,
    )
  }
  return {
    shape: 'cell',
    expected,
    rows,
    columns,
    isCorrect: (given) => given.row === expected.row && given.column === expected.column,
  }
}
