import {
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { MazeKnobs, Size } from './knobs'

export type Side = 'north' | 'east' | 'south' | 'west'

export interface Spot {
  readonly row: number
  readonly column: number
}

/** A gap in the border, numbered clockwise from the top left corner. */
export interface Exit extends Spot {
  readonly side: Side
  readonly number: number
}

/** The walls inside the maze around one cell; the border is walled except at the exits. */
export interface Walls {
  readonly east: boolean
  readonly south: boolean
}

export interface MazePrompt {
  /** Cells to a side. */
  readonly size: number
  /** Row by row, `size × size` cells. */
  readonly walls: readonly Walls[]
  readonly exits: readonly Exit[]
  readonly treasure: Spot
  /** With a key, every exit reaches the treasure, but only one way passes the key. */
  readonly key: Spot | null
}

export type MazeAnswer = ChoiceAnswer
export type MazeTask = Task<MazePrompt, MazeAnswer>

export const PLUGIN_ID = 'maze'

export function isMazeTask(task: Task): task is MazeTask {
  return task.pluginId === PLUGIN_ID
}

export const SIZES: Record<Size, number> = { small: 5, big: 7 }

/** Mazes are drawn again until one fits; the odds are good, so this is never reached. */
const TRIES = 1_000

/** A wrong exit's corridor runs at least this many steps before it is cut off. */
const CORRIDOR = 2

interface Built {
  readonly prompt: MazePrompt
  readonly right: number
}

export function generateMaze({ size, exits, key }: MazeKnobs, random: Random): MazeTask {
  const n = SIZES[size]
  for (let i = 0; i < TRIES; i++) {
    const built = attempt(n, exits, key === true, random)
    if (built) {
      const { prompt, right } = built
      const options = prompt.exits.map((e) => ({
        value: String(e.number),
        label: String(e.number),
      }))
      return {
        pluginId: PLUGIN_ID,
        itemKey: `maze:${size}:${encode(prompt)}`,
        prompt,
        answer: choiceAnswer(String(right), options),
      }
    }
  }
  throw new RangeError(`No ${String(n)} × ${String(n)} maze with ${String(exits)} exits fits`)
}

/** Cells by index, `row * n + column`; a passage joins two neighbouring cells. */
const edge = (a: number, b: number) =>
  a < b ? `${String(a)}-${String(b)}` : `${String(b)}-${String(a)}`

function neighbours(cell: number, n: number): number[] {
  const row = Math.floor(cell / n)
  const column = cell % n
  const result: number[] = []
  if (row > 0) result.push(cell - n)
  if (row < n - 1) result.push(cell + n)
  if (column > 0) result.push(cell - 1)
  if (column < n - 1) result.push(cell + 1)
  return result
}

/** A perfect maze — every cell reached by exactly one way — carved by a random depth-first walk. */
function carve(n: number, random: Random): Set<string> {
  const open = new Set<string>()
  const start = randomInt(random, 0, n * n - 1)
  const seen = new Set([start])
  const stack = [start]
  while (stack.length > 0) {
    const cell = stack[stack.length - 1] ?? 0
    const fresh = neighbours(cell, n).filter((c) => !seen.has(c))
    if (fresh.length === 0) {
      stack.pop()
      continue
    }
    const next = pick(random, fresh)
    open.add(edge(cell, next))
    seen.add(next)
    stack.push(next)
  }
  return open
}

/** The cells from `from` to `to` through open passages, both ends included, or null. */
export function way(
  open: ReadonlySet<string>,
  n: number,
  from: number,
  to: number,
): number[] | null {
  const parent = new Map<number, number>([[from, from]])
  const queue = [from]
  while (queue.length > 0) {
    const cell = queue.shift() ?? from
    if (cell === to) break
    for (const next of neighbours(cell, n)) {
      if (!parent.has(next) && open.has(edge(cell, next))) {
        parent.set(next, cell)
        queue.push(next)
      }
    }
  }
  if (!parent.has(to)) return null
  const path = [to]
  for (let cell = to; cell !== from;) {
    cell = parent.get(cell) ?? from
    path.push(cell)
  }
  return path.reverse()
}

/** Where a spot on the border lies going clockwise from the top left corner. */
function around(row: number, column: number, side: Side, n: number): number {
  switch (side) {
    case 'north':
      return column
    case 'east':
      return n + row
    case 'south':
      return 2 * n + (n - 1 - column)
    case 'west':
      return 3 * n + (n - 1 - row)
  }
}

/** Every gap the border could have: each border cell on each of its outer sides. */
function borderSpots(n: number): { row: number; column: number; side: Side }[] {
  const spots: { row: number; column: number; side: Side }[] = []
  for (let i = 0; i < n; i++) {
    spots.push({ row: 0, column: i, side: 'north' })
    spots.push({ row: n - 1, column: i, side: 'south' })
    spots.push({ row: i, column: 0, side: 'west' })
    spots.push({ row: i, column: n - 1, side: 'east' })
  }
  return spots
}

function attempt(n: number, count: number, withKey: boolean, random: Random): Built | null {
  const open = carve(n, random)

  // Exits far enough apart that two gaps never sit side by side.
  const chosen: { row: number; column: number; side: Side }[] = []
  const spots = borderSpots(n)
  while (chosen.length < count && spots.length > 0) {
    const index = randomInt(random, 0, spots.length - 1)
    const [spot] = spots.splice(index, 1)
    if (
      spot &&
      chosen.every((c) => Math.abs(c.row - spot.row) + Math.abs(c.column - spot.column) >= 2)
    ) {
      chosen.push(spot)
    }
  }
  if (chosen.length < count) return null
  chosen.sort((a, b) => around(a.row, a.column, a.side, n) - around(b.row, b.column, b.side, n))
  const exits: Exit[] = chosen.map((c, i) => ({ ...c, number: i + 1 }))

  // The treasure stands inside, off the border.
  const treasureRow = randomInt(random, 1, n - 2)
  const treasureColumn = randomInt(random, 1, n - 2)
  const treasure = treasureRow * n + treasureColumn
  const cellOf = (e: Spot) => e.row * n + e.column

  const rightIndex = randomInt(random, 0, exits.length - 1)
  const right = exits[rightIndex]
  if (!right) return null
  const rightWay = way(open, n, cellOf(right), treasure)
  if (!rightWay) return null
  const rightEdges = new Set(rightWay.slice(1).map((cell, i) => edge(rightWay[i] ?? cell, cell)))
  const wrong = exits.filter((_, i) => i !== rightIndex)

  let key: Spot | null = null
  if (withKey) {
    // Every way is kept; the key goes where only the right way passes.
    const onWrongWays = new Set<number>()
    for (const e of wrong)
      for (const cell of way(open, n, cellOf(e), treasure) ?? []) onWrongWays.add(cell)
    const candidates = rightWay.filter(
      (cell) => cell !== treasure && cell !== cellOf(right) && !onWrongWays.has(cell),
    )
    if (candidates.length === 0) return null
    const cell = pick(random, candidates)
    key = { row: Math.floor(cell / n), column: cell % n }
  } else {
    // Each wrong way is walled off where it would join the right one, after a corridor.
    for (const e of wrong) {
      const path = way(open, n, cellOf(e), treasure)
      if (!path) continue
      const own = path
        .slice(1)
        .map((cell, i) => edge(path[i] ?? cell, cell))
        .filter((passage) => !rightEdges.has(passage))
      if (own.length < CORRIDOR) return null
      open.delete(own[own.length - 1] ?? '')
    }
    if (!way(open, n, cellOf(right), treasure)) return null
    if (wrong.some((e) => way(open, n, cellOf(e), treasure))) return null
  }

  const walls: Walls[] = []
  for (let cell = 0; cell < n * n; cell++) {
    const column = cell % n
    const row = Math.floor(cell / n)
    walls.push({
      east: column === n - 1 || !open.has(edge(cell, cell + 1)),
      south: row === n - 1 || !open.has(edge(cell, cell + n)),
    })
  }
  return {
    prompt: {
      size: n,
      walls,
      exits,
      treasure: { row: treasureRow, column: treasureColumn },
      key,
    },
    right: right.number,
  }
}

/** One maze as a string: the walls of every cell, then the exits, the treasure and the key. */
function encode({ walls, exits, treasure, key }: MazePrompt): string {
  const cells = walls.map((w) => String((w.east ? 1 : 0) + (w.south ? 2 : 0))).join('')
  const gaps = exits.map((e) => `${String(e.row)}.${String(e.column)}${e.side[0] ?? ''}`).join(',')
  const spot = (s: Spot) => `${String(s.row)}.${String(s.column)}`
  return `${cells}|${gaps}|${spot(treasure)}|${key ? spot(key) : '-'}`
}
