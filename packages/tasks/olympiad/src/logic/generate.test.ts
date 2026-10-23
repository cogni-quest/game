import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import type { Lines } from './figures'
import { generateOlympiad, type OlympiadPrompt, type OlympiadTask } from './generate'
import type { OlympiadKnobs } from './knobs'
import { olympiadPlugin } from './plugin'
import { THINGS } from './things'

const SAMPLES = 1_000

function sample(knobs: OlympiadKnobs) {
  const random = createRandom(17)
  return Array.from({ length: SAMPLES }, () => generateOlympiad(knobs, random))
}

type Figures = Extract<OlympiadPrompt, { ask: 'figures' }>
type Weighing = Extract<OlympiadPrompt, { ask: 'weighing' }>

function figures(task: OlympiadTask): Figures {
  if (task.prompt.ask !== 'figures') throw new Error('expected figures')
  return task.prompt
}

function weighing(task: OlympiadTask): Weighing {
  if (task.prompt.ask !== 'weighing') throw new Error('expected weighing')
  return task.prompt
}

/** Two points are joined when one drawn line holds them both. */
function joined({ lines }: Lines, a: number, b: number): boolean {
  return lines.some((line) => line.includes(a) && line.includes(b))
}

/** Every triangle of the drawing: three points joined pairwise and not on one line. */
function countTriangles(drawing: Lines): number {
  const { points } = drawing
  let count = 0
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      for (let c = b + 1; c < points.length; c++) {
        const [pa, pb, pc] = [points[a], points[b], points[c]]
        if (!pa || !pb || !pc) continue
        const area = (pb.x - pa.x) * (pc.y - pa.y) - (pc.x - pa.x) * (pb.y - pa.y)
        if (area !== 0 && joined(drawing, a, b) && joined(drawing, b, c) && joined(drawing, a, c)) {
          count++
        }
      }
    }
  }
  return count
}

/** Every upright rectangle (or only squares): four corners, each side drawn. */
function countRectangles(drawing: Lines, squaresOnly: boolean): number {
  const { points } = drawing
  const at = (x: number, y: number) => points.findIndex((p) => p.x === x && p.y === y)
  const xs = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b)
  const ys = [...new Set(points.map((p) => p.y))].sort((a, b) => a - b)
  let count = 0
  for (const [i, x1] of xs.entries()) {
    for (const x2 of xs.slice(i + 1)) {
      for (const [j, y1] of ys.entries()) {
        for (const y2 of ys.slice(j + 1)) {
          if (squaresOnly && x2 - x1 !== y2 - y1) continue
          const corners = [at(x1, y1), at(x2, y1), at(x2, y2), at(x1, y2)]
          if (corners.some((c) => c < 0)) continue
          const [a = 0, b = 0, c = 0, d = 0] = corners
          if (
            joined(drawing, a, b) &&
            joined(drawing, b, c) &&
            joined(drawing, c, d) &&
            joined(drawing, d, a)
          ) {
            count++
          }
        }
      }
    }
  }
  return count
}

describe('figures', () => {
  it('counts overlapping figures as a brute-force search over the drawing does', () => {
    const wrong = sample({ ask: 'figures', overlap: true }).filter((task) => {
      const { target, drawing } = figures(task)
      if (drawing.type !== 'lines') return true
      const counted =
        target === 'triangle'
          ? countTriangles(drawing)
          : countRectangles(drawing, target === 'square')
      return counted !== task.answer.expected
    })
    expect(wrong).toEqual([])
  })

  it('brings every overlapping puzzle, from 3 to 14', () => {
    const keys = new Set(sample({ ask: 'figures', overlap: true }).map((t) => t.itemKey))
    expect(keys.size).toBe(12)
    const answers = sample({ ask: 'figures', overlap: true }).map((t) => t.answer.expected)
    expect([Math.min(...answers), Math.max(...answers)]).toEqual([3, 14])
  })

  it('apart: counts only the asked kind, which is there at least twice, among others', () => {
    const wrong = sample({ ask: 'figures', overlap: false }).filter((task) => {
      const { target, drawing } = figures(task)
      if (drawing.type !== 'apart') return true
      const ofKind = drawing.shapes.filter((s) => s.kind === target).length
      const cells = new Set(drawing.shapes.map((s) => `${String(s.x)},${String(s.y)}`))
      return (
        ofKind !== task.answer.expected ||
        ofKind < 2 ||
        ofKind === drawing.shapes.length ||
        cells.size !== drawing.shapes.length
      )
    })
    expect(wrong).toEqual([])
  })
})

describe('weighing', () => {
  /** Every thing's weight in the lightest one asked, worked out from the scales. */
  function solve(prompt: Weighing): number {
    const weight = new Map<string, number>([[prompt.of, 1]])
    // Pass over the scales until no new weight is learnt.
    let learnt = true
    while (learnt) {
      learnt = false
      for (const { left, right } of prompt.scales) {
        const known = weight.get(right.thing)
        if (known !== undefined && !weight.has(left.thing)) {
          weight.set(left.thing, (known * right.count) / left.count)
          learnt = true
        }
      }
    }
    return (weight.get(prompt.against.thing) ?? NaN) * prompt.against.count
  }

  it.each([1, 2] as const)('chain %i: the answer balances the scales, up to 30', (chain) => {
    const wrong = sample({ ask: 'weighing', chain }).filter((task) => {
      const prompt = weighing(task)
      return (
        solve(prompt) !== task.answer.expected ||
        task.answer.expected > 30 ||
        task.answer.expected < 2 ||
        prompt.scales.length !== chain
      )
    })
    expect(wrong).toEqual([])
  })

  it('always swaps a heavier thing for several lighter ones', () => {
    const order = THINGS.map((t) => t.id)
    const wrong = sample({ ask: 'weighing', chain: 2 }).filter((task) =>
      weighing(task).scales.some(
        ({ left, right }) =>
          order.indexOf(left.thing) >= order.indexOf(right.thing) || right.count <= left.count,
      ),
    )
    expect(wrong).toEqual([])
  })
})

describe('olympiadPlugin', () => {
  it('reads the scales aloud with the right endings', () => {
    const task = sample({ ask: 'weighing', chain: 2 })[0]
    if (!task) throw new Error('no task')
    expect(olympiadPlugin.speak(task)).toMatch(
      /^1 [а-я]+ весит столько же, сколько \d [а-я]+\. 1 [а-я]+ весит столько же, сколько \d [а-я]+\. Сколько [а-я]+ весят столько же, сколько 1 [а-я]+\?$/,
    )
    const figure = sample({ ask: 'figures', overlap: true })[0]
    if (!figure) throw new Error('no task')
    expect(olympiadPlugin.speak(figure)).toMatch(
      /^Сколько (треугольников|прямоугольников|квадратов) на рисунке\?$/,
    )
  })

  it.each([{ ask: 'figures' }, { ask: 'weighing', chain: 3 }, { ask: 'age' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => olympiadPlugin.generate(knobs, createRandom(1))).toThrow(/olympiad/)
    },
  )
})
