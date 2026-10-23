import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { Figure, PerimeterKnobs } from './knobs'

export interface Point {
  readonly x: number
  readonly y: number
}

export interface PerimeterPrompt {
  readonly figure: Figure
  /** Every side's length, in order around the figure (or along the line). */
  readonly sides: readonly number[]
  /** The corners where the drawing goes, already fitted to the picture. */
  readonly points: readonly Point[]
  /** Which sides carry their length; the rest the child works out. */
  readonly signed: readonly number[]
}

export type PerimeterTask = Task<PerimeterPrompt, NumberAnswer>

export const PLUGIN_ID = 'perimeter'

export function isPerimeterTask(task: Task): task is PerimeterTask {
  return task.pluginId === PLUGIN_ID
}

export const WIDTH = 380
export const HEIGHT = 260
const MARGIN = 48
const SHORTEST = 2
const TRIES = 10_000

interface Drawing {
  readonly sides: readonly number[]
  readonly raw: readonly Point[]
  readonly signed: readonly number[]
}

export function generatePerimeter({ figure, max }: PerimeterKnobs, random: Random): PerimeterTask {
  const { sides, raw, signed } = drawFigure(figure, max, random)
  const shown = signed.map((i) => sides[i] ?? 0)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `perim:${figure}:${shown.join('+')}`,
    prompt: { figure, sides, points: fit(raw), signed },
    answer: numberAnswer(sum(sides), max),
  }
}

/** The sides, a drawing to fit later and which sides are signed. */
function drawFigure(figure: Figure, max: number, random: Random): Drawing {
  const longest = Math.max(SHORTEST + 2, Math.min(Math.floor(max / 3), 40))
  const side = () => randomInt(random, SHORTEST, longest)
  switch (figure) {
    case 'broken-line': {
      const links = draw(
        () => [side(), side(), side()],
        (s) => sum(s) <= max,
      )
      return { sides: links, raw: zigzag(links, random), signed: [0, 1, 2] }
    }
    case 'triangle': {
      const edges = draw(
        () => [side(), side(), side()],
        ([x = 0, y = 0, z = 0]) =>
          x + y + z <= max && x + y > z + 1 && y + z > x + 1 && x + z > y + 1,
      )
      return { sides: edges, raw: triangle(edges), signed: [0, 1, 2] }
    }
    case 'quadrilateral': {
      const edges = draw(
        () => [side(), side(), side(), side()],
        (s) => sum(s) <= max,
      )
      return { sides: edges, raw: quadrilateral(random), signed: [0, 1, 2, 3] }
    }
    case 'rectangle': {
      const [x = 0, y = 0] = draw(
        () => [side(), side()],
        ([p = 0, q = 0]) => p !== q && 2 * (p + q) <= max,
      )
      const [w, h] = x > y ? [x, y] : [y, x]
      return { sides: [w, h, w, h], raw: corners(w, h), signed: [0, 1] }
    }
    case 'square': {
      const [x = 0] = draw(
        () => [side()],
        ([p = 0]) => 4 * p <= max,
      )
      return { sides: [x, x, x, x], raw: corners(x, x), signed: [0] }
    }
  }
}

function corners(w: number, h: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]
}

function sum(numbers: readonly number[]): number {
  return numbers.reduce((s, n) => s + n, 0)
}

function draw(make: () => number[], fits: (sides: readonly number[]) => boolean): number[] {
  for (let i = 0; i < TRIES; i++) {
    const sides = make()
    if (fits(sides)) return sides
  }
  throw new RangeError('No sides fit the range')
}

/** Three links going up and down in turn, to scale. */
function zigzag(sides: readonly number[], random: Random): Point[] {
  const up = randomInt(random, 0, 1) === 0 ? 1 : -1
  const points: Point[] = [{ x: 0, y: 0 }]
  sides.forEach((length, i) => {
    const angle = ((i % 2 === 0 ? 35 : -35) * up * Math.PI) / 180
    const last = points[points.length - 1] ?? { x: 0, y: 0 }
    points.push({ x: last.x + length * Math.cos(angle), y: last.y - length * Math.sin(angle) })
  })
  return points
}

/** A triangle with these sides, to scale: the first lies flat at the bottom. */
function triangle([a = 0, b = 0, c = 0]: readonly number[]): Point[] {
  // A at the origin, B along the bottom; C from the law of cosines.
  const x = (a * a + c * c - b * b) / (2 * a)
  const y = Math.sqrt(Math.max(c * c - x * x, 0))
  return [
    { x: 0, y: 0 },
    { x: a, y: 0 },
    { x, y: -y },
  ]
}

/** Four corners of a rectangle, each nudged: any four sides could be drawn so. */
function quadrilateral(random: Random): Point[] {
  const nudge = () => randomInt(random, -20, 20)
  return [
    { x: 0 + nudge(), y: 0 + nudge() },
    { x: 200 + nudge(), y: 0 + nudge() },
    { x: 230 + nudge(), y: 120 + nudge() },
    { x: -20 + nudge(), y: 130 + nudge() },
  ]
}

/** Scales and moves the drawing into the picture, keeping its proportions. */
function fit(points: readonly Point[]): Point[] {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const [left, right, top, bottom] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ]
  const scale = Math.min(
    (WIDTH - 2 * MARGIN) / Math.max(right - left, 1),
    (HEIGHT - 2 * MARGIN) / Math.max(bottom - top, 1),
  )
  const dx = (WIDTH - (right - left) * scale) / 2
  const dy = (HEIGHT - (bottom - top) * scale) / 2
  return points.map((p) => ({
    x: Math.round(dx + (p.x - left) * scale),
    y: Math.round(dy + (p.y - top) * scale),
  }))
}
