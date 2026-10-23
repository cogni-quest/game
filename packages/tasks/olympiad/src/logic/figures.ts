import { pick, randomInt, type Random } from '@cogni/core'

/** The size of every drawing, in SVG units. */
export const WIDTH = 360
export const HEIGHT = 260

export type Target = 'triangle' | 'rectangle' | 'square' | 'circle'

export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * Figures made of shared lines. Each line lists the points on it, in order,
 * and is drawn from its first point to its last, so any two points of one line
 * are joined by a drawn segment.
 */
export interface Lines {
  readonly type: 'lines'
  readonly points: readonly Point[]
  readonly lines: readonly (readonly number[])[]
}

export type ShapeKind = 'triangle' | 'square' | 'circle' | 'pentagon'

/** Figures standing apart, one to a cell. */
export interface Apart {
  readonly type: 'apart'
  readonly shapes: readonly { readonly kind: ShapeKind; readonly x: number; readonly y: number }[]
}

export interface Figures {
  readonly target: Target
  readonly drawing: Lines | Apart
  readonly expected: number
  /** What makes the puzzle the same puzzle, for the item key. */
  readonly key: string
}

const p = (x: number, y: number): Point => ({ x, y })

/** n + 1 numbers from `from` to `to`, evenly apart, rounded. */
function spaced(from: number, to: number, n: number): number[] {
  return Array.from({ length: n + 1 }, (_, i) => Math.round(from + ((to - from) * i) / n))
}

/** A triangle cut by n − 1 lines from its top into n parts: n(n + 1)/2 triangles. */
function fan(n: number): Figures {
  const base = spaced(30, 330, n).map((x) => p(x, 240))
  const points = [p(180, 20), ...base]
  const lines = [...base.map((_, i) => [0, i + 1]), base.map((_, i) => i + 1)]
  return {
    target: 'triangle',
    drawing: { type: 'lines', points, lines },
    expected: (n * (n + 1)) / 2,
    key: `fan${String(n)}`,
  }
}

/**
 * The same triangle crossed half way down by a line along its base: twice as
 * many, n(n + 1). The base points are spaced so the crossing points land on
 * whole numbers, exactly on their lines.
 */
function fanCrossed(n: number): Figures {
  const apex = p(180, 20)
  const base = spaced(30, 330, n).map((x) => p(x, 240))
  const cross = base.map((b) => p(apex.x + (b.x - apex.x) / 2, apex.y + (b.y - apex.y) / 2))
  const count = base.length
  // apex 0, base 1…count, cross count+1…2·count
  const points = [apex, ...base, ...cross]
  const lines = [
    ...base.map((_, i) => [0, count + 1 + i, i + 1]),
    base.map((_, i) => i + 1),
    cross.map((_, i) => count + 1 + i),
  ]
  return {
    target: 'triangle',
    drawing: { type: 'lines', points, lines },
    expected: n * (n + 1),
    key: `cross${String(n)}`,
  }
}

/** A square with both diagonals: four small triangles and four big ones. */
function diagonals(): Figures {
  const points = [p(60, 10), p(300, 10), p(300, 250), p(60, 250), p(180, 130)]
  const lines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 4, 2],
    [1, 4, 3],
  ]
  return { target: 'triangle', drawing: { type: 'lines', points, lines }, expected: 8, key: 'diag' }
}

/** A grid of `columns` × `rows` cells, every row and column line drawn through. */
function grid(columns: number, rows: number, cell: number): Lines {
  const left = (WIDTH - columns * cell) / 2
  const top = (HEIGHT - rows * cell) / 2
  const index = (c: number, r: number) => r * (columns + 1) + c
  const points: Point[] = []
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= columns; c++) points.push(p(left + c * cell, top + r * cell))
  }
  const lines: number[][] = []
  for (let r = 0; r <= rows; r++)
    lines.push(Array.from({ length: columns + 1 }, (_, c) => index(c, r)))
  for (let c = 0; c <= columns; c++)
    lines.push(Array.from({ length: rows + 1 }, (_, r) => index(c, r)))
  return { type: 'lines', points, lines }
}

/** A rectangle cut into n strips: n(n + 1)/2 rectangles. */
function strips(n: number): Figures {
  return {
    target: 'rectangle',
    drawing: grid(n, 1, n === 4 ? 75 : 90),
    expected: (n * (n + 1)) / 2,
    key: `strips${String(n)}`,
  }
}

/** A k × k grid: the squares of every size, 5 for 2 × 2 and 14 for 3 × 3. */
function squares(k: number): Figures {
  let expected = 0
  for (let size = 1; size <= k; size++) expected += (k - size + 1) ** 2
  return {
    target: 'square',
    drawing: grid(k, k, k === 2 ? 110 : 75),
    expected,
    key: `squares${String(k)}`,
  }
}

/** A 2 × 2 grid asked for rectangles: the squares count too, nine in all. */
function gridRectangles(): Figures {
  return { target: 'rectangle', drawing: grid(2, 2, 110), expected: 9, key: 'rects2' }
}

const FAMILIES: readonly (() => Figures)[] = [
  () => fan(2),
  () => fan(3),
  () => fan(4),
  () => fanCrossed(2),
  () => fanCrossed(3),
  diagonals,
  () => strips(2),
  () => strips(3),
  () => strips(4),
  () => squares(2),
  () => squares(3),
  gridRectangles,
]

export function overlapping(random: Random): Figures {
  return pick(random, FAMILIES)()
}

const COLUMNS = 4
const ROWS = 3
const APART_TARGETS = ['triangle', 'square', 'circle'] as const
const KINDS: readonly ShapeKind[] = ['triangle', 'square', 'circle', 'pentagon']

/** 6 to 10 figures apart, 2 to 6 of them of the asked kind. */
export function apart(random: Random): Figures {
  const target = pick(random, APART_TARGETS)
  const total = randomInt(random, 6, 10)
  const count = randomInt(random, 2, Math.min(6, total - 1))
  const others = KINDS.filter((k) => k !== target)
  const kinds: ShapeKind[] = [
    ...Array.from({ length: count }, () => target),
    ...Array.from({ length: total - count }, () => pick(random, others)),
  ]
  // Cells drawn without repeats, then the kinds dealt out in a shuffled order.
  const cells = Array.from({ length: COLUMNS * ROWS }, (_, i) => i)
  const shapes = kinds.map((kind) => {
    const cell = cells.splice(randomInt(random, 0, cells.length - 1), 1)[0] ?? 0
    const cw = WIDTH / COLUMNS
    const ch = HEIGHT / ROWS
    return {
      kind,
      x: Math.round((cell % COLUMNS) * cw + cw / 2),
      y: Math.round(Math.floor(cell / COLUMNS) * ch + ch / 2),
    }
  })
  return {
    target,
    drawing: { type: 'apart', shapes },
    expected: count,
    key: `apart:${target}:${String(count)}/${String(total)}`,
  }
}
