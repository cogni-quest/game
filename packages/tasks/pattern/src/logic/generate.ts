import {
  chance,
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type ChoiceOption,
  type Random,
  type Task,
} from '@cogni/core'

import {
  COLOURS,
  figureId,
  figureLabel,
  sameFigure,
  SHAPES,
  type Figure,
  type FigureId,
} from './figures'
import type { PatternKnobs } from './knobs'

/** A figure of the row, or the empty place the answer goes into. */
export type Place = Figure | 'blank'

export interface PatternPrompt {
  readonly ask: PatternKnobs['ask']
  readonly places: readonly Place[]
}

export type PatternTask = Task<PatternPrompt, ChoiceAnswer<FigureId>>

export const PLUGIN_ID = 'pattern'

export function isPatternTask(task: Task): task is PatternTask {
  return task.pluginId === PLUGIN_ID
}

/** Two features each keep their own turn: one every two places, one every three. */
const FEATURE_PERIODS = [
  [2, 3],
  [3, 2],
] as const

export function generatePattern({ ask, unit }: PatternKnobs, random: Random): PatternTask {
  const at = rule(unit, random)
  // Enough of the row that every figure of the turn is seen at least twice.
  const shown = unit === 'two-features' ? randomInt(random, 6, 8) : randomInt(random, 5, 8)
  const length = ask === 'next' ? shown + 1 : Math.max(shown, 6)
  const blank = ask === 'next' ? length - 1 : randomInt(random, 1, length - 2)
  const figures = Array.from({ length }, (_, i) => at(i))
  const answer = figures[blank] ?? at(blank)
  const places: Place[] = figures.map((figure, i) => (i === blank ? 'blank' : figure))

  return {
    pluginId: PLUGIN_ID,
    itemKey: `pat:${ask}:${figures.map(figureId).join('.')}:${String(blank)}`,
    prompt: { ask, places },
    answer: choiceAnswer(figureId(answer), options(answer, figures, unit, random)),
  }
}

/** The figure at each place of the row. */
function rule(unit: PatternKnobs['unit'], random: Random): (i: number) => Figure {
  if (unit === 'two-features') {
    const [shapePeriod, colourPeriod] = pick(random, FEATURE_PERIODS)
    const shapes = draw(SHAPES, shapePeriod, random)
    const colours = draw(COLOURS, colourPeriod, random)
    return (i) => ({
      shape: shapes[i % shapePeriod] ?? 'circle',
      colour: colours[i % colourPeriod] ?? 'red',
    })
  }
  const count = unit === 'two' ? 2 : 3
  const kinds = distinctFigures(count, random)
  const turn: readonly Figure[] =
    unit === 'two'
      ? kinds
      : (() => {
          const [a, b, c] = kinds as [Figure, Figure, Figure]
          return pick(random, [
            [a, b, c],
            [a, a, b],
            [a, b, b],
          ] as const)
        })()
  return (i) => turn[i % turn.length] ?? kinds[0] ?? { shape: 'circle', colour: 'red' }
}

/** `count` different items of a list, in a random order. */
function draw<T>(items: readonly T[], count: number, random: Random): T[] {
  const left = [...items]
  return Array.from(
    { length: count },
    () => left.splice(randomInt(random, 0, left.length - 1), 1)[0] as T,
  )
}

/** Figures that differ in shape, so the turn can be told apart without colour. */
function distinctFigures(count: number, random: Random): Figure[] {
  const shapes = draw(SHAPES, count, random)
  const oneColour = chance(random, 0.5)
  const colours = oneColour
    ? Array.from({ length: count }, () => pick(random, COLOURS))
    : draw(COLOURS, count, random)
  const colour = colours[0] ?? 'red'
  return shapes.map((shape, i) => ({ shape, colour: oneColour ? colour : (colours[i] ?? colour) }))
}

/**
 * The right figure among three or four: the other figures of the row, and —
 * when shape and colour turn apart — ones right in just one of them.
 */
function options(
  answer: Figure,
  row: readonly Figure[],
  unit: PatternKnobs['unit'],
  random: Random,
): ChoiceOption<FigureId>[] {
  const count = unit === 'two-features' ? 4 : 3
  const pool: Figure[] = []
  const add = (figure: Figure) => {
    if (!pool.some((f) => sameFigure(f, figure))) pool.push(figure)
  }
  add(answer)
  if (unit === 'two-features') {
    add({
      shape: pick(
        random,
        SHAPES.filter((s) => s !== answer.shape),
      ),
      colour: answer.colour,
    })
    add({
      shape: answer.shape,
      colour: pick(
        random,
        COLOURS.filter((c) => c !== answer.colour),
      ),
    })
  }
  // The answer and the near misses always stay; the rest are drawn from the row.
  const kept = pool.length
  for (const figure of row) add(figure)
  while (pool.length < count) add({ shape: pick(random, SHAPES), colour: pick(random, COLOURS) })

  const chosen = [...pool.slice(0, kept), ...draw(pool.slice(kept), count - kept, random)]
  return draw(chosen, chosen.length, random).map((figure) => ({
    value: figureId(figure),
    label: figureLabel(figure),
  }))
}
