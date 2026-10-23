import {
  choiceAnswer,
  numberAnswer,
  pick,
  pickAnswer,
  randomInt,
  type ChoiceAnswer,
  type NumberAnswer,
  type PickAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { CountKnobs, NameKnobs, ShapeSet, ShapesKnobs, Target } from './knobs'
import { draw, LABELS, SETS, TARGETS, type Figure, type ShapeId } from './shapes'

export type ShapesPrompt =
  | { readonly ask: 'name'; readonly set: ShapeSet; readonly figure: Figure }
  | {
      readonly ask: 'count' | 'find'
      readonly target: Target
      /** In reading order; with `find` they are numbered so. */
      readonly figures: readonly Figure[]
    }

export type ShapesAnswer = ChoiceAnswer<ShapeId> | NumberAnswer | PickAnswer
export type ShapesTask = Task<ShapesPrompt, ShapesAnswer>

export const PLUGIN_ID = 'shapes'

export function isShapesTask(task: Task): task is ShapesTask {
  return task.pluginId === PLUGIN_ID
}

/** The picture is this big; a field to count is four cells across and three down. */
export const WIDTH = 360
export const HEIGHT = 240
const COLUMNS = 4
const ROWS = 3
const CELL_WIDTH = WIDTH / COLUMNS
const CELL_HEIGHT = HEIGHT / ROWS
/** Small enough, with the jitter, that shapes in neighbouring cells never touch. */
const CELL_SIZE = 28
const JITTER = 6
const NAME_SIZE = 90
const OPTIONS = 4

export function generateShapes(knobs: ShapesKnobs, random: Random): ShapesTask {
  return knobs.ask === 'name' ? nameShape(knobs, random) : countShapes(knobs, random)
}

function nameShape({ set, rotated }: NameKnobs, random: Random): ShapesTask {
  const names = SETS[set]
  const shape = pick(random, names)
  const others = shuffled(
    random,
    names.filter((n) => n !== shape),
  ).slice(0, OPTIONS - 1)
  const offered = names.filter((n) => n === shape || others.includes(n))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `shape:name:${set}:${shape}${rotated === true ? 'r' : ''}`,
    prompt: {
      ask: 'name',
      set,
      figure: {
        shape,
        geometry: draw(shape, { x: WIDTH / 2, y: HEIGHT / 2 }, NAME_SIZE, rotated === true, random),
      },
    },
    answer: choiceAnswer(
      shape,
      offered.map((value) => ({ value, label: LABELS[value] })),
    ),
  }
}

function countShapes(knobs: CountKnobs, random: Random): ShapesTask {
  const { ask, target, min, max, rotated } = knobs
  const total = randomInt(random, min, max)
  const count = randomInt(random, 1, total - 1)
  const { kinds, others } = TARGETS[target]
  const shapes = Array.from({ length: total }, (_, i) => pick(random, i < count ? kinds : others))
  const cells = shuffled(
    random,
    Array.from({ length: COLUMNS * ROWS }, (_, i) => i),
  )
  const placed = shapes.map((shape, i) => ({ shape, cell: cells[i] ?? 0 }))
  placed.sort((a, b) => a.cell - b.cell)
  const figures = placed.map(({ shape, cell }): Figure => {
    const center = {
      x: (cell % COLUMNS) * CELL_WIDTH + CELL_WIDTH / 2 + randomInt(random, -JITTER, JITTER),
      y:
        Math.floor(cell / COLUMNS) * CELL_HEIGHT +
        CELL_HEIGHT / 2 +
        randomInt(random, -JITTER, JITTER),
    }
    return { shape, geometry: draw(shape, center, CELL_SIZE, rotated === true, random) }
  })
  const turned = rotated === true ? 'r' : ''
  if (ask === 'count') {
    return {
      pluginId: PLUGIN_ID,
      itemKey: `shape:count:${target}:${String(count)}/${String(total)}${turned}`,
      prompt: { ask, target, figures },
      answer: numberAnswer(count, max),
    }
  }
  const options = figures.map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
  const found = options.filter((_, i) => kinds.includes(figures[i]?.shape ?? 'circle'))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `shape:find:${target}:${figures.map((f) => f.shape.slice(0, 3)).join(',')}${turned}`,
    prompt: { ask, target, figures },
    answer: pickAnswer(
      found.map((o) => o.value),
      options,
    ),
  }
}

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = result[i]
    const b = result[j]
    if (a === undefined || b === undefined) throw new RangeError('shuffle out of range')
    result[i] = b
    result[j] = a
  }
  return result
}
