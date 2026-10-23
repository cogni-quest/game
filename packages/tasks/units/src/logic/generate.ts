import {
  chance,
  choiceAnswer,
  numberAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { PairId, UnitsKnobs } from './knobs'
import { PAIRS } from './units'

/** One amount of one unit on either side; the blank is the answer. */
export interface Part {
  readonly count: number | 'blank'
  readonly unit: 'big' | 'small'
}

export interface UnitsPrompt {
  readonly pair: PairId
  /** `=` for a conversion, `□` for «сравни». */
  readonly sign: '=' | '□'
  readonly left: readonly Part[]
  readonly right: readonly Part[]
}

export type Relation = 'greater' | 'less' | 'equal'

/** The same three words as «что больше?», in the same order. */
export const RELATIONS = [
  { value: 'greater', label: '> больше' },
  { value: 'less', label: '< меньше' },
  { value: 'equal', label: '= равно' },
] as const

export type UnitsAnswer = NumberAnswer | ChoiceAnswer<Relation>
export type UnitsTask = Task<UnitsPrompt, UnitsAnswer>

export const PLUGIN_ID = 'units'

export function isUnitsTask(task: Task): task is UnitsTask {
  return task.pluginId === PLUGIN_ID
}

const BLANK_SMALL: Part = { count: 'blank', unit: 'small' }

/** How far the two sides of a «сравни» lie apart, in the small unit. */
const COMPARE_GAP = 3

export function generateUnits({ pair, form, max }: UnitsKnobs, random: Random): UnitsTask {
  const { ratio } = PAIRS[pair]
  const make = (key: string, left: Part[], right: Part[], expected: number): UnitsTask => ({
    pluginId: PLUGIN_ID,
    itemKey: `${pair}:${key}`,
    prompt: { pair, sign: '=', left, right },
    answer: numberAnswer(expected, max),
  })

  switch (form) {
    case 'whole': {
      const big = randomInt(random, 1, Math.floor(max / ratio))
      const small = big * ratio
      return chance(random, 0.5)
        ? make(`${String(big)}>`, [{ count: big, unit: 'big' }], [BLANK_SMALL], small)
        : make(
            `${String(small)}<`,
            [{ count: small, unit: 'small' }],
            [{ count: 'blank', unit: 'big' }],
            big,
          )
    }
    case 'compound': {
      const [total, big, small] = mixed(ratio, max, random)
      return make(
        `${String(big)}+${String(small)}`,
        [
          { count: big, unit: 'big' },
          { count: small, unit: 'small' },
        ],
        [BLANK_SMALL],
        total,
      )
    }
    case 'split': {
      const [total, big, small] = mixed(ratio, max, random)
      return make(
        `${String(total)}/`,
        [{ count: total, unit: 'small' }],
        [{ count: big, unit: 'big' }, BLANK_SMALL],
        small,
      )
    }
    case 'compare-whole': {
      const big = randomInt(random, 1, Math.floor(max / ratio))
      return compare(pair, [{ count: big, unit: 'big' }], big * ratio, max, random)
    }
    case 'compare': {
      const [total, big, small] = mixed(ratio, max, random)
      const left: Part[] = [
        { count: big, unit: 'big' },
        { count: small, unit: 'small' },
      ]
      return compare(pair, left, total, max, random)
    }
  }
}

/** The left side against an amount of the small unit near it, or equal to it now and then. */
function compare(
  pair: PairId,
  left: Part[],
  value: number,
  max: number,
  random: Random,
): UnitsTask {
  const gaps: number[] = []
  for (let gap = -COMPARE_GAP; gap <= COMPARE_GAP; gap++) {
    if (value + gap >= 1 && value + gap <= max) gaps.push(gap)
  }
  const right =
    value +
    (chance(random, 1 / 4)
      ? 0
      : pick(
          random,
          gaps.filter((g) => g !== 0),
        ))
  const relation: Relation = value > right ? 'greater' : value < right ? 'less' : 'equal'
  const leftKey = left.map((p) => `${String(p.count)}${p.unit[0] ?? ''}`).join('')
  return {
    pluginId: PLUGIN_ID,
    itemKey: `${pair}:${leftKey}?${String(right)}`,
    prompt: { pair, sign: '□', left, right: [{ count: right, unit: 'small' }] },
    answer: choiceAnswer(relation, RELATIONS),
  }
}

/** An amount that is some of the big unit and some of the small: 11…19, 21…29. */
function mixed(ratio: number, max: number, random: Random): readonly [number, number, number] {
  const big = randomInt(random, 1, Math.floor((max - 1) / ratio))
  const small = randomInt(random, 1, Math.min(ratio - 1, max - big * ratio))
  return [big * ratio + small, big, small]
}
