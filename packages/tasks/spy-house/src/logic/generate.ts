import { cellAnswer, pick, type Cell, type CellAnswer, type Random, type Task } from '@cogni/core'

import { LANDMARK_KINDS, type ClueKind, type SpyHouseKnobs } from './knobs'

/** Every house is this tall (decided with the parent): counting floors is part of the skill. */
export const FLOORS = 5

/** What can sit in a window besides the spy. Told apart by shape and colour at a glance. */
export const LANDMARKS = ['cat', 'cactus', 'teddy'] as const
export type Landmark = (typeof LANDMARKS)[number]

/**
 * The house, top floor first — the way a board counts rows. Each window holds
 * a landmark or nothing; the spy is in one of the empty ones.
 */
export type House = readonly (readonly (Landmark | null)[])[]

export type Side = 'left' | 'right'

/**
 * One clue of the report. Left and right are as the house is seen from the
 * street. Floors count from the ground: floor 1 is the bottom row.
 */
export type Clue =
  | { readonly kind: 'floor'; readonly floor: number }
  | { readonly kind: 'edge'; readonly edge: Side | 'middle' }
  /** The `place`-th window counted from `side`, 2 or 3: the first is the edge. */
  | { readonly kind: 'ordinal'; readonly side: Side; readonly place: number }
  /** The spy is the next window to the `side` of a window with `of`. */
  | { readonly kind: 'beside'; readonly side: Side; readonly of: Landmark }
  /** One of them on each side, in either order: the text order says nothing of the sides. */
  | { readonly kind: 'between'; readonly of: readonly [Landmark, Landmark] }
  /** The spy is a floor `above` or `below` a window with `of`, in the same column. */
  | { readonly kind: 'vertical'; readonly side: 'above' | 'below'; readonly of: Landmark }

export interface SpyHousePrompt {
  readonly floors: number
  readonly windows: number
  readonly house: House
  /** In the order the report reads them. */
  readonly clues: readonly Clue[]
}

export type SpyHouseAnswer = CellAnswer
export type SpyHouseTask = Task<SpyHousePrompt, SpyHouseAnswer>

export const PLUGIN_ID = 'spy-house'

export function isSpyHouseTask(task: Task): task is SpyHouseTask {
  return task.pluginId === PLUGIN_ID
}

/** The floor of a row: the top row is the top floor. */
export const floorOf = (row: number): number => FLOORS - row

const at = (house: House, row: number, column: number): Landmark | null | undefined =>
  house[row]?.[column]

/** A landmark is there: not an empty window, not off the house. */
const isLandmark = (window: Landmark | null | undefined): window is Landmark =>
  window !== null && window !== undefined

/** Whether a window fits one clue. Only empty windows can hold the spy. */
export function fits(house: House, { row, column }: Cell, clue: Clue): boolean {
  if (at(house, row, column) !== null) return false
  const windows = house[row]?.length ?? 0
  switch (clue.kind) {
    case 'floor':
      return floorOf(row) === clue.floor
    case 'edge':
      return clue.edge === 'left'
        ? column === 0
        : clue.edge === 'right'
          ? column === windows - 1
          : windows % 2 === 1 && windows >= 3 && column === (windows - 1) / 2
    case 'ordinal':
      return column === (clue.side === 'left' ? clue.place - 1 : windows - clue.place)
    case 'beside':
      return at(house, row, column + (clue.side === 'left' ? 1 : -1)) === clue.of
    case 'between': {
      const left = at(house, row, column - 1)
      const right = at(house, row, column + 1)
      const [a, b] = clue.of
      return (left === a && right === b) || (left === b && right === a)
    }
    case 'vertical':
      return at(house, row + (clue.side === 'above' ? 1 : -1), column) === clue.of
  }
}

function allWindows(house: House): Cell[] {
  return house.flatMap((floor, row) => floor.map((_, column) => ({ row, column })))
}

/** The windows that fit every clue given. */
export function candidates(house: House, clues: readonly Clue[]): Cell[] {
  return allWindows(house).filter((cell) => clues.every((clue) => fits(house, cell, clue)))
}

/**
 * Which windows are still in play after each clue in turn — what the
 * walk-through after a miss shows: the first entry is every empty window, the
 * last is the spy's alone.
 */
export function narrowing(house: House, clues: readonly Clue[]): Cell[][] {
  return Array.from({ length: clues.length + 1 }, (_, i) => candidates(house, clues.slice(0, i)))
}

/** Every clue of one kind that is true of the window. */
function cluesOf(kind: ClueKind, house: House, { row, column }: Cell): Clue[] {
  const windows = house[row]?.length ?? 0
  const left = at(house, row, column - 1)
  const right = at(house, row, column + 1)
  const under = at(house, row + 1, column)
  const over = at(house, row - 1, column)
  switch (kind) {
    case 'floor':
      return [{ kind, floor: floorOf(row) }]
    case 'edge':
      return [
        ...(column === 0 ? [{ kind, edge: 'left' } as const] : []),
        ...(column === windows - 1 ? [{ kind, edge: 'right' } as const] : []),
        ...(windows % 2 === 1 && windows >= 3 && column === (windows - 1) / 2
          ? [{ kind, edge: 'middle' } as const]
          : []),
      ].filter(() => windows >= 2)
    case 'ordinal':
      return [
        { kind, side: 'left', place: column + 1 } as const,
        { kind, side: 'right', place: windows - column } as const,
      ].filter((c) => c.place === 2 || c.place === 3)
    case 'beside':
      return [
        ...(isLandmark(right) ? [{ kind, side: 'left', of: right } as const] : []),
        ...(isLandmark(left) ? [{ kind, side: 'right', of: left } as const] : []),
      ]
    case 'between':
      return isLandmark(left) && isLandmark(right) ? [{ kind, of: [left, right] }] : []
    case 'vertical':
      return [
        ...(isLandmark(under) ? [{ kind, side: 'above', of: under } as const] : []),
        ...(isLandmark(over) ? [{ kind, side: 'below', of: over } as const] : []),
      ]
  }
}

/** Puts a landmark beside the spy where a clue of this kind needs one; false when it cannot. */
function plant(kind: ClueKind, rows: (Landmark | null)[][], target: Cell, random: Random): boolean {
  const { row, column } = target
  const windows = rows[row]?.length ?? 0
  const put = (r: number, c: number, avoid?: Landmark): Landmark | null => {
    const floor = rows[r]
    if (!floor || c < 0 || c >= floor.length) return null
    const here = floor[c] ?? null
    if (here !== null && here !== avoid) return here
    const landmark = pick(
      random,
      LANDMARKS.filter((l) => l !== avoid),
    )
    floor[c] = landmark
    return landmark
  }
  switch (kind) {
    case 'beside': {
      const sides = [column + 1, column - 1].filter((c) => c >= 0 && c < windows)
      if (sides.length === 0) return false
      return put(row, pick(random, sides)) !== null
    }
    case 'between': {
      if (column < 1 || column > windows - 2) return false
      const first = put(row, column - 1)
      // Two different landmarks: «между 🐱 и 🐱» reads oddly.
      return first !== null && put(row, column + 1, first) !== null
    }
    case 'vertical': {
      const rowsNear = [row + 1, row - 1].filter((r) => r >= 0 && r < FLOORS)
      return put(pick(random, rowsNear), column) !== null
    }
    case 'floor':
    case 'edge':
    case 'ordinal':
      return true
  }
}

/** A house with the spy's window empty and its landmarks planted for the recipe. */
function buildHouse(
  windows: number,
  landmarks: number,
  recipe: readonly ClueKind[],
  target: Cell,
  random: Random,
): House | null {
  const rows: (Landmark | null)[][] = Array.from({ length: FLOORS }, () =>
    Array.from({ length: windows }, () => null),
  )
  for (const kind of recipe) {
    if (LANDMARK_KINDS.has(kind) && !plant(kind, rows, target, random)) return null
  }
  const free = allWindows(rows).filter(
    (c) => (c.row !== target.row || c.column !== target.column) && rows[c.row]?.[c.column] === null,
  )
  let placed = FLOORS * windows - 1 - free.length
  while (placed < landmarks && free.length > 0) {
    const index = Math.floor(random() * free.length)
    const [cell] = free.splice(index, 1)
    const floor = cell ? rows[cell.row] : undefined
    if (!cell || !floor) break
    floor[cell.column] = pick(random, LANDMARKS)
    placed++
  }
  return rows
}

/** Whether the report fits exactly the spy's window, and needs every one of its clues. */
export function isSharp(house: House, clues: readonly Clue[]): boolean {
  if (candidates(house, clues).length !== 1) return false
  return clues.every(
    (_, i) =>
      candidates(
        house,
        clues.filter((__, j) => j !== i),
      ).length > 1,
  )
}

/**
 * The landmark windows a clue leans on for a window that fits it: where the
 * walk-through after a miss draws its arrows from. None for floors and counts.
 */
export function anchorsOf(clue: Clue, { row, column }: Cell): Cell[] {
  switch (clue.kind) {
    case 'beside':
      return [{ row, column: column + (clue.side === 'left' ? 1 : -1) }]
    case 'between':
      return [
        { row, column: column - 1 },
        { row, column: column + 1 },
      ]
    case 'vertical':
      return [{ row: row + (clue.side === 'above' ? 1 : -1), column }]
    case 'floor':
    case 'edge':
    case 'ordinal':
      return []
  }
}

/** The landmarks a clue names, for the item key and the walk-through. */
export function landmarksOf(clue: Clue): readonly Landmark[] {
  return clue.kind === 'between' ? clue.of : 'of' in clue ? [clue.of] : []
}

const LETTER: Record<Landmark, string> = { cat: 'c', cactus: 'k', teddy: 't' }

function clueKey(clue: Clue): string {
  switch (clue.kind) {
    case 'floor':
      return `floor${String(clue.floor)}`
    case 'edge':
      return `edge-${clue.edge}`
    case 'ordinal':
      return `ordinal${String(clue.place)}-${clue.side}`
    case 'beside':
      return `beside-${clue.side}-${clue.of}`
    case 'between':
      return `between-${clue.of.join('-')}`
    case 'vertical':
      return `${clue.side}-${clue.of}`
  }
}

/** Tries before giving up; the tests show a section needs only a handful. */
const TRIES = 5000

export function generateSpyHouse(knobs: SpyHouseKnobs, random: Random): SpyHouseTask {
  const { windows, recipes } = knobs
  const landmarks = knobs.landmarks ?? 0
  for (let i = 0; i < TRIES; i++) {
    const recipe = pick(random, recipes)
    const target = {
      row: Math.floor(random() * FLOORS),
      column: Math.floor(random() * windows),
    }
    const house = buildHouse(windows, landmarks, recipe, target, random)
    if (!house) continue
    const clues: Clue[] = []
    for (const kind of recipe) {
      const options = cluesOf(kind, house, target)
      if (options.length === 0) break
      clues.push(pick(random, options))
    }
    if (clues.length !== recipe.length || !isSharp(house, clues)) continue

    const code = house
      .map((floor) => floor.map((w) => (w === null ? '.' : LETTER[w])).join(''))
      .join('/')
    return {
      pluginId: PLUGIN_ID,
      itemKey: `spy:${code}:${String(target.row)}.${String(target.column)}:${clues.map(clueKey).join('+')}`,
      prompt: { floors: FLOORS, windows, house, clues },
      answer: cellAnswer(target, FLOORS, windows),
    }
  }
  throw new RangeError(`No sharp report found for ${JSON.stringify(knobs)}`)
}
