import {
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { ComparingKnobs } from './knobs'

/** Read left to right: in `5 □ 7` the five is the one that is less. */
export type Relation = 'greater' | 'less' | 'equal'

export interface ComparingPrompt {
  readonly left: number
  readonly right: number
  /**
   * How the left side is shown: written; as circles to count; or as two groups
   * of circles (`groups` holds their sizes) to be added before comparing.
   */
  readonly show: 'number' | 'picture' | 'groups'
  readonly groups?: readonly [number, number]
}

export type ComparingTask = Task<ComparingPrompt, ChoiceAnswer<Relation>>

export const PLUGIN_ID = 'comparing'

export function isComparingTask(task: Task): task is ComparingTask {
  return task.pluginId === PLUGIN_ID
}

/** All three words are offered every time, in the same order. */
export const RELATIONS = [
  { value: 'greater', label: '> больше' },
  { value: 'less', label: '< меньше' },
  { value: 'equal', label: '= равно' },
] as const

const FAR = 4

/** With two groups, the sides stay this close, so the sum has to be worked out. */
const GROUPS_NEAR = 2

export function generateComparing(knobs: ComparingKnobs, random: Random): ComparingTask {
  if (knobs.groups === true) return compareGroups(knobs.max, random)
  const [left, right] = pair(knobs, random)
  const show = knobs.picture === true ? 'picture' : 'number'
  return makeTask(
    left,
    right,
    { show },
    `${show === 'picture' ? 'p' : ''}${String(left)}?${String(right)}`,
  )
}

function makeTask(
  left: number,
  right: number,
  shown: Pick<ComparingPrompt, 'show' | 'groups'>,
  itemKey: string,
): ComparingTask {
  const relation: Relation = left > right ? 'greater' : left < right ? 'less' : 'equal'
  return {
    pluginId: PLUGIN_ID,
    itemKey,
    prompt: { left, right, ...shown },
    answer: choiceAnswer(relation, RELATIONS),
  }
}

/** The tens of a two-digit number, the hundreds of a three-digit one. */
const lead = (n: number) => (n >= 100 ? Math.floor(n / 100) : Math.floor(n / 10))
const digits = (n: number) => String(n).length

const LEAD_FITS = {
  'other-lead': (a: number, b: number) => lead(a) !== lead(b),
  'same-lead': (a: number, b: number) => lead(a) === lead(b) && a !== b,
  trap: (a: number, b: number) => {
    const [small, big] = a < b ? [a, b] : [b, a]
    return lead(big) - lead(small) === 1 && small % 10 > big % 10
  },
} as const

const DRAWS = 100_000

/**
 * Every pair that fits the distance is enumerated and one is drawn; numbers of
 * two and three digits are too many to list, so they are drawn until a pair of
 * the same length fits.
 */
function pair(
  { min = 1, max, distance }: ComparingKnobs,
  random: Random,
): readonly [number, number] {
  if (distance === 'other-lead' || distance === 'same-lead' || distance === 'trap') {
    const fits = LEAD_FITS[distance]
    for (let i = 0; i < DRAWS; i++) {
      const a = randomInt(random, min, max)
      const b = randomInt(random, min, max)
      if (digits(a) === digits(b) && fits(a, b)) return [a, b]
    }
    throw new RangeError(`No pair from ${String(min)} to ${String(max)} fits '${distance}'`)
  }
  const pairs: [number, number][] = []
  for (let a = min; a <= max; a++) {
    for (let b = min; b <= max; b++) {
      const gap = Math.abs(a - b)
      const fits =
        distance === 'any' ||
        (distance === 'far' && gap >= FAR) ||
        (distance === 'near' && gap === 1) ||
        (distance === 'equal' && gap === 0)
      if (fits) pairs.push([a, b])
    }
  }
  return pick(random, pairs)
}

/** «●●● ●● □ 6»: two groups whose sum is within two of the number on the right. */
function compareGroups(max: number, random: Random): ComparingTask {
  const choices: [number, number, number][] = []
  for (let a = 1; a < max; a++) {
    for (let b = 1; a + b <= max; b++) {
      for (let right = 1; right <= max; right++) {
        if (Math.abs(a + b - right) <= GROUPS_NEAR) choices.push([a, b, right])
      }
    }
  }
  const [a, b, right] = pick(random, choices)
  return makeTask(
    a + b,
    right,
    { show: 'groups', groups: [a, b] },
    `g${String(a)}+${String(b)}?${String(right)}`,
  )
}
