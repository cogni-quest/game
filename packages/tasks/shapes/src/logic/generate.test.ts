import { createRandom, isChoiceAnswer, isPickAnswer } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateShapes, HEIGHT, WIDTH } from './generate'
import type { ShapesKnobs } from './knobs'
import { shapesPlugin } from './plugin'
import { cornerAngles, SETS, type Figure, type Geometry, type Point } from './shapes'

const SAMPLES = 500

function sample(knobs: ShapesKnobs) {
  const random = createRandom(9)
  return Array.from({ length: SAMPLES }, () => generateShapes(knobs, random))
}

function named(knobs: ShapesKnobs) {
  return sample(knobs).flatMap((t) =>
    t.prompt.ask === 'name' && isChoiceAnswer(t.answer)
      ? [{ prompt: t.prompt, answer: t.answer }]
      : [],
  )
}

function counted(knobs: ShapesKnobs) {
  return sample(knobs).flatMap((t) =>
    t.prompt.ask === 'count' ? [{ ...t, prompt: t.prompt }] : [],
  )
}

function pointsOf(geometry: Geometry): readonly Point[] {
  switch (geometry.type) {
    case 'circle': {
      const { center, r } = geometry
      return [
        { x: center.x - r, y: center.y - r },
        { x: center.x + r, y: center.y + r },
      ]
    }
    case 'dot':
      return [geometry.at]
    case 'polygon':
    case 'polyline':
      return geometry.points
    case 'curve':
      return [geometry.from, geometry.control, geometry.to]
  }
}

function box({ geometry }: Figure) {
  const points = pointsOf(geometry)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  }
}

describe('generateShapes: name', () => {
  it.each(['familiar', 'lines', 'polygons', 'quads'] as const)(
    '%s: offers three or four names of the set, the right one among them, none twice',
    (set) => {
      const wrong = named({ ask: 'name', set }).filter(({ prompt, answer }) => {
        const values = answer.options.map((o) => o.value)
        return (
          answer.expected !== prompt.figure.shape ||
          !values.includes(prompt.figure.shape) ||
          new Set(values).size !== values.length ||
          values.length < 3 ||
          values.length > 4 ||
          values.some((v) => !SETS[set].includes(v))
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it('asks every shape of the set', () => {
    const asked = new Set(named({ ask: 'name', set: 'lines' }).map((t) => t.prompt.figure.shape))
    expect(asked).toEqual(new Set(SETS.lines))
  })

  it('draws each shape in one pose, and in many poses when rotated', () => {
    for (const set of ['familiar', 'lines', 'polygons', 'quads'] as const) {
      const poses = (rotated: boolean) => {
        const byShape = new Map<string, Set<string>>()
        for (const t of named(rotated ? { ask: 'name', set, rotated } : { ask: 'name', set })) {
          const shape = t.prompt.figure.shape
          const seen = byShape.get(shape) ?? new Set()
          seen.add(JSON.stringify(t.prompt.figure.geometry))
          byShape.set(shape, seen)
        }
        return [...byShape.values()].map((s) => s.size)
      }
      expect(poses(false).every((n) => n === 1)).toBe(true)
      expect(poses(true).every((n) => n > 1)).toBe(true)
    }
  })

  it('keeps points and the ends of segments inside the picture', () => {
    const wrong = named({ ask: 'name', set: 'lines', rotated: true }).filter(({ prompt }) => {
      const { geometry } = prompt.figure
      const marked =
        geometry.type === 'polyline' ? geometry.dots : geometry.type === 'dot' ? [geometry.at] : []
      return marked.some((p) => p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT)
    })
    expect(wrong).toEqual([])
  })
})

describe('generateShapes: count', () => {
  const corners = { triangle: 3, quadrilateral: 4 } as const

  it.each(['triangle', 'square', 'circle', 'quadrilateral'] as const)(
    '%s: the answer is how many of them there are, never none, never all',
    (target) => {
      const wrong = counted({ ask: 'count', target, min: 4, max: 12, rotated: true }).filter(
        ({ prompt, answer }) => {
          const matching = prompt.figures.filter(({ shape, geometry }) => {
            if (target === 'circle') return geometry.type === 'circle'
            if (target === 'square') return shape === 'square'
            return geometry.type === 'polygon' && geometry.points.length === corners[target]
          }).length
          return (
            answer.expected !== matching ||
            matching < 1 ||
            matching >= prompt.figures.length ||
            prompt.figures.length < 4 ||
            prompt.figures.length > 12
          )
        },
      )
      expect(wrong).toEqual([])
    },
  )

  it('counts squares and rectangles as quadrilaterals', () => {
    const shapes = new Set(
      counted({ ask: 'count', target: 'quadrilateral', min: 6, max: 12 }).flatMap((t) =>
        t.prompt.figures.map((f) => f.shape),
      ),
    )
    expect(shapes).toContain('square')
    expect(shapes).toContain('rectangle')
    expect(shapes).toContain('quadrilateral')
  })

  it('never lets two shapes touch, and keeps them inside the picture', () => {
    const wrong = counted({
      ask: 'count',
      target: 'triangle',
      min: 12,
      max: 12,
      rotated: true,
    }).filter(({ prompt }) => {
      const boxes = prompt.figures.map(box)
      const outside = boxes.some(
        (b) => b.left < 0 || b.top < 0 || b.right > WIDTH || b.bottom > HEIGHT,
      )
      const touching = boxes.some((a, i) =>
        boxes
          .slice(i + 1)
          .some(
            (b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom,
          ),
      )
      return outside || touching
    })
    expect(wrong).toEqual([])
  })
})

describe('find all', () => {
  it('asks to press exactly the shapes of the target kind, numbered in reading order', () => {
    const wrong = sample({ ask: 'find', target: 'triangle', min: 4, max: 8 }).filter(
      ({ prompt, answer }) => {
        if (prompt.ask === 'name' || !isPickAnswer(answer)) return true
        const triangles = prompt.figures
          .map((f, i) => (f.shape === 'triangle' ? String(i + 1) : ''))
          .filter(Boolean)
        return (
          answer.expected.join() !== triangles.join() ||
          answer.options.length !== prompt.figures.length
        )
      },
    )
    expect(wrong).toEqual([])
  })
})

describe('four corners', () => {
  it('keeps squares and rectangles right-angled, and a plain four-cornered shape never so', () => {
    const wrong = named({ ask: 'name', set: 'quads', rotated: true }).filter(({ prompt }) => {
      const angles = cornerAngles(pointsOf(prompt.figure.geometry))
      const right = angles.every((a) => Math.abs(a - 90) < 3)
      return prompt.figure.shape === 'quadrilateral'
        ? right || angles.every((a) => Math.abs(a - 90) < 12)
        : !right
    })
    expect(wrong).toEqual([])
  })
})

describe('shapesPlugin', () => {
  it('asks the question aloud', () => {
    const name = shapesPlugin.generateTyped({ ask: 'name', set: 'familiar' }, createRandom(1))
    expect(shapesPlugin.speak(name)).toBe('Как называется эта фигура?')
    const count = shapesPlugin.generateTyped(
      { ask: 'count', target: 'triangle', min: 4, max: 6 },
      createRandom(1),
    )
    expect(shapesPlugin.speak(count)).toBe('Сколько треугольников?')
  })

  it.each([
    { ask: 'name', set: 'animals' },
    { ask: 'count', target: 'triangle', min: 8, max: 4 },
    { ask: 'count', target: 'triangle', min: 4, max: 20 },
    { ask: 'count', target: 'star', min: 4, max: 6 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => shapesPlugin.generate(knobs, createRandom(1))).toThrow(/shapes/)
  })
})
