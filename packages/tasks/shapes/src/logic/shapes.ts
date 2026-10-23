import { randomInt, type Random } from '@cogni/core'

import type { ShapeSet, Target } from './knobs'

export type ShapeId =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'point'
  | 'line'
  | 'ray'
  | 'segment'
  | 'curve'
  | 'polyline'
  | 'quadrilateral'
  | 'pentagon'
  | 'hexagon'

export const LABELS: Record<ShapeId, string> = {
  circle: 'круг',
  triangle: 'треугольник',
  square: 'квадрат',
  rectangle: 'прямоугольник',
  point: 'точка',
  line: 'прямая',
  ray: 'луч',
  segment: 'отрезок',
  curve: 'кривая',
  polyline: 'ломаная',
  quadrilateral: 'четырёхугольник',
  pentagon: 'пятиугольник',
  hexagon: 'шестиугольник',
}

/** The names offered together, in the order the buttons show them. */
export const SETS: Record<ShapeSet, readonly ShapeId[]> = {
  familiar: ['circle', 'triangle', 'square', 'rectangle'],
  lines: ['point', 'line', 'ray', 'segment', 'curve'],
  polygons: ['polyline', 'triangle', 'quadrilateral', 'pentagon', 'hexagon'],
  quads: ['square', 'rectangle', 'quadrilateral'],
}

/** What counts as the target, and what else is put in the field around it. */
export const TARGETS: Record<
  Target,
  { readonly kinds: readonly ShapeId[]; readonly others: readonly ShapeId[] }
> = {
  triangle: { kinds: ['triangle'], others: ['circle', 'square', 'rectangle', 'pentagon'] },
  square: { kinds: ['square'], others: ['circle', 'triangle', 'rectangle', 'pentagon'] },
  circle: { kinds: ['circle'], others: ['triangle', 'square', 'pentagon', 'hexagon'] },
  quadrilateral: {
    kinds: ['square', 'rectangle', 'quadrilateral'],
    others: ['circle', 'triangle', 'pentagon', 'hexagon'],
  },
}

export interface Point {
  readonly x: number
  readonly y: number
}

/** Everything the view needs to draw one shape. */
export type Geometry =
  | { readonly type: 'circle'; readonly center: Point; readonly r: number }
  | { readonly type: 'dot'; readonly at: Point }
  /** Closed and filled. */
  | { readonly type: 'polygon'; readonly points: readonly Point[] }
  /** Open, with a dot at each of `dots`; ends far outside the picture are cut off by it. */
  | {
      readonly type: 'polyline'
      readonly points: readonly Point[]
      readonly dots: readonly Point[]
    }
  | { readonly type: 'curve'; readonly from: Point; readonly control: Point; readonly to: Point }

export interface Figure {
  readonly shape: ShapeId
  readonly geometry: Geometry
}

/** Far enough to run off any picture: the end of a line or a ray. */
const FAR = 600

function between(random: Random, min: number, max: number): number {
  return min + random() * (max - min)
}

function at(center: Point, radius: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180
  return {
    x: Math.round(center.x + radius * Math.cos(angle)),
    y: Math.round(center.y + radius * Math.sin(angle)),
  }
}

/** Corners at the given angles, each at its own distance from the centre. */
function corners(
  center: Point,
  size: number,
  angles: readonly number[],
  stretch: () => number,
): Point[] {
  return angles.map((angle) => at(center, size * stretch(), angle))
}

/** How far from right at least one corner of a plain «четырёхугольник» is, in degrees. */
const SKEW = 12

/** The inner angle at each corner of a polygon, in degrees. */
export function cornerAngles(points: readonly Point[]): number[] {
  return points.map((p, i) => {
    const prev = points[(i + points.length - 1) % points.length] ?? p
    const next = points[(i + 1) % points.length] ?? p
    const a = Math.atan2(prev.y - p.y, prev.x - p.x)
    const b = Math.atan2(next.y - p.y, next.x - p.x)
    const degrees = Math.abs(((b - a) * 180) / Math.PI) % 360
    return degrees > 180 ? 360 - degrees : degrees
  })
}

/** Offsets from the centre, turned by `turn` degrees. */
function placed(center: Point, offsets: readonly (readonly [number, number])[], turn: number) {
  return offsets.map(([dx, dy]) =>
    at(center, Math.hypot(dx, dy), (Math.atan2(dy, dx) * 180) / Math.PI + turn),
  )
}

/**
 * One shape around `center`, no further than `size` from it — except lines,
 * rays and curves, which are only drawn on their own. Unrotated, each shape
 * is in its textbook pose; rotated, it is turned and, where its kind allows,
 * stretched.
 */
export function draw(
  shape: ShapeId,
  center: Point,
  size: number,
  rotated: boolean,
  random: Random,
): Geometry {
  const turn = (min: number, max: number) => (rotated ? randomInt(random, min, max) : 0)
  const stretch = (min: number, max: number) => () => (rotated ? between(random, min, max) : 1)
  switch (shape) {
    case 'circle':
      return { type: 'circle', center, r: Math.round(size * stretch(0.6, 1)()) }
    case 'point':
      return {
        type: 'dot',
        at: rotated
          ? { x: center.x + randomInt(random, -60, 60), y: center.y + randomInt(random, -40, 40) }
          : center,
      }
    case 'triangle': {
      const t = turn(0, 359)
      const angles = [-90, 30, 150].map((a) => a + t + turn(-20, 20))
      return { type: 'polygon', points: corners(center, size, angles, stretch(0.7, 1)) }
    }
    case 'square': {
      const t = turn(10, 80)
      return {
        type: 'polygon',
        points: corners(
          center,
          size,
          [45, 135, 225, 315].map((a) => a + t),
          () => 1,
        ),
      }
    }
    case 'rectangle': {
      const w = size * 0.85
      const h = size * (rotated ? between(random, 0.3, 0.5) : 0.5)
      const offsets = [
        [w, h],
        [-w, h],
        [-w, -h],
        [w, -h],
      ] as const
      return { type: 'polygon', points: placed(center, offsets, turn(10, 170)) }
    }
    case 'quadrilateral': {
      if (!rotated) {
        const offsets = [
          [-0.85, 0.5],
          [0.85, 0.5],
          [0.45, -0.5],
          [-0.6, -0.5],
        ] as const
        return {
          type: 'polygon',
          points: placed(
            center,
            offsets.map(([x, y]) => [x * size, y * size] as const),
            0,
          ),
        }
      }
      // Drawn again until one corner is clearly not right: a four-cornered shape
      // that happens to look like a rectangle would make «четырёхугольник» wrong.
      for (;;) {
        const t = turn(0, 359)
        const angles = [45, 135, 225, 315].map((a) => a + t + turn(-25, 25))
        const points = corners(center, size, angles, stretch(0.65, 1))
        if (cornerAngles(points).some((a) => Math.abs(a - 90) >= SKEW)) {
          return { type: 'polygon', points }
        }
      }
    }
    case 'pentagon':
    case 'hexagon': {
      const n = shape === 'pentagon' ? 5 : 6
      const t = turn(0, 359)
      const angles = Array.from({ length: n }, (_, i) => -90 + (i * 360) / n + t)
      return { type: 'polygon', points: corners(center, size, angles, stretch(0.85, 1)) }
    }
    case 'segment': {
      const half = size * stretch(0.6, 1.1)() * 1.2
      const t = turn(0, 179)
      const ends = [at(center, half, t), at(center, half, t + 180)]
      return { type: 'polyline', points: ends, dots: ends }
    }
    case 'ray': {
      const t = turn(0, 359)
      const start = at(center, size * 0.8, t + 180)
      return { type: 'polyline', points: [start, at(start, FAR, t)], dots: [start] }
    }
    case 'line': {
      const t = turn(0, 179)
      const through = rotated
        ? { x: center.x + randomInt(random, -30, 30), y: center.y + randomInt(random, -20, 20) }
        : center
      return {
        type: 'polyline',
        points: [at(through, FAR, t), at(through, FAR, t + 180)],
        dots: [],
      }
    }
    case 'curve': {
      const t = turn(0, 359)
      const bend = rotated ? between(random, 0.8, 1.2) * (random() < 0.5 ? -1 : 1) : 1.1
      const [from, control, to] = placed(
        center,
        [
          [-1.2 * size, 0.5 * size],
          [0, -bend * size],
          [1.2 * size, 0.5 * size],
        ],
        t,
      )
      if (from === undefined || control === undefined || to === undefined) throw new Error('curve')
      return { type: 'curve', from, control, to }
    }
    case 'polyline': {
      const n = rotated ? randomInt(random, 3, 5) : 4
      const step = (2.4 * size) / (n - 1)
      const offsets = Array.from({ length: n }, (_, i) => {
        const rise = rotated ? between(random, 0.3, 0.55) : 0.5
        return [-1.2 * size + i * step, (i % 2 === 0 ? 1 : -1) * rise * size] as const
      })
      const points = placed(center, offsets, turn(0, 359))
      return { type: 'polyline', points, dots: points }
    }
  }
}
