import {
  chance,
  choiceAnswer,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { ExpressionsKnobs, Sides } from './knobs'

export type Op = '+' | '−'

/** One side of `□`: a number, or `a + b`, `a − b`. */
export type Side = readonly [number] | readonly [number, Op, number]

/** Read left to right: in `7 □ 3 + 5` the seven is the one that is less. */
export type Relation = 'greater' | 'less' | 'equal'

export interface ExpressionsPrompt {
  readonly sides: Sides
  readonly left: Side
  readonly right: Side
}

export type ExpressionsTask = Task<ExpressionsPrompt, ChoiceAnswer<Relation>>

export const PLUGIN_ID = 'expressions'

export function isExpressionsTask(task: Task): task is ExpressionsTask {
  return task.pluginId === PLUGIN_ID
}

/** The same three words, in the same order, as «что больше?». */
export const RELATIONS = [
  { value: 'greater', label: '> больше' },
  { value: 'less', label: '< меньше' },
  { value: 'equal', label: '= равно' },
] as const

/** How often a section that allows it draws two equal sides. */
const EQUAL_SHARE = 0.25
/** With the same term, the other terms differ by one to this. */
const NEAR = 5
const TRIES = 10_000

export function valueOf(side: Side): number {
  return side.length === 1 ? side[0] : side[1] === '+' ? side[0] + side[2] : side[0] - side[2]
}

export function written(side: Side): string {
  return side.join(' ')
}

export function generateExpressions(
  { sides, max }: ExpressionsKnobs,
  random: Random,
): ExpressionsTask {
  const [left, right] = drawSides(sides, max, random)
  const [l, r] = [valueOf(left), valueOf(right)]
  const relation: Relation = l > r ? 'greater' : l < r ? 'less' : 'equal'
  return {
    pluginId: PLUGIN_ID,
    itemKey: `expr:${written(left)}?${written(right)}`,
    prompt: { sides, left, right },
    answer: choiceAnswer(relation, RELATIONS),
  }
}

function drawSides(sides: Sides, max: number, random: Random): readonly [Side, Side] {
  const equal = sides !== 'same-term' && chance(random, EQUAL_SHARE)
  for (let i = 0; i < TRIES; i++) {
    const pair = ((): readonly [Side, Side] | undefined => {
      switch (sides) {
        case 'number-expression': {
          const expression = expressionUpTo(max, random)
          const number: Side = [equal ? valueOf(expression) : randomInt(random, 1, max)]
          return chance(random, 0.5) ? [number, expression] : [expression, number]
        }
        case 'expressions':
          return [expressionUpTo(max, random), expressionUpTo(max, random)]
        case 'same-term':
          return sameTerm(max, random)
      }
    })()
    if (pair === undefined) continue
    const [left, right] = pair
    const fits = [left, right].every((side) => {
      const v = valueOf(side)
      return v >= 0 && v <= max
    })
    const same = valueOf(left) === valueOf(right)
    if (fits && same === equal && written(left) !== written(right)) return pair
  }
  throw new RangeError(`No sides up to ${String(max)} fit «${sides}»`)
}

/** `a + b` or `a − b`, both terms from one up. */
function expressionUpTo(max: number, random: Random): Side {
  const a = randomInt(random, 1, max - 1)
  const b = randomInt(random, 1, max - 1)
  return chance(random, 0.5) ? [a, '+', b] : [a, '−', b]
}

/** `47 + 28 □ 47 + 25`: the first term and the sign the same, the second near. */
function sameTerm(max: number, random: Random): readonly [Side, Side] | undefined {
  // Up to a hundred the second terms are two-digit, so working out is slow.
  const least = max > 20 ? 10 : 2
  const a = randomInt(random, least, max - least)
  const b = randomInt(random, least, max - least)
  const c = b + (chance(random, 0.5) ? 1 : -1) * randomInt(random, 1, NEAR)
  if (c < least) return undefined
  const op: Op = chance(random, 0.5) ? '+' : '−'
  return [
    [a, op, b],
    [a, op, c],
  ]
}
