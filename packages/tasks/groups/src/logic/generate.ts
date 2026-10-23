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

import type { GroupsKnobs } from './knobs'

/** Read left to right: in `3 × 4 □ 4 × 4` the left side is the one that is less. */
export type Relation = 'greater' | 'less' | 'equal'

/** All three words are offered every time, in the same order. */
export const RELATIONS = [
  { value: 'greater', label: '> больше' },
  { value: 'less', label: '< меньше' },
  { value: 'equal', label: '= равно' },
] as const

export type GroupsPrompt =
  /** `size` added `count` times; `sum` asks the total, `product` the count. */
  | { readonly ask: 'sum' | 'product'; readonly size: number; readonly count: number }
  | { readonly ask: 'plates'; readonly groups: number; readonly size: number }
  | { readonly ask: 'array'; readonly rows: number; readonly columns: number }
  | {
      readonly ask: 'commutative'
      readonly left: readonly [number, number]
      readonly right: readonly [number, number]
    }
  /** `total` candies onto `groups` plates; how many on each. */
  | { readonly ask: 'share'; readonly total: number; readonly groups: number }
  /** `total` candies, `size` to a plate; how many plates. */
  | { readonly ask: 'measure-out'; readonly total: number; readonly size: number }

export type GroupsAnswer = NumberAnswer | ChoiceAnswer<Relation>
export type GroupsTask = Task<GroupsPrompt, GroupsAnswer>

export const PLUGIN_ID = 'groups'

export function isGroupsTask(task: Task): task is GroupsTask {
  return task.pluginId === PLUGIN_ID
}

const SMALLEST_SHARE = 2
const MOST_PLATES = 5

export function generateGroups(knobs: GroupsKnobs, random: Random): GroupsTask {
  const make = (itemKey: string, prompt: GroupsPrompt, answer: GroupsAnswer): GroupsTask => ({
    pluginId: PLUGIN_ID,
    itemKey: `grp:${knobs.ask}:${itemKey}`,
    prompt,
    answer,
  })

  switch (knobs.ask) {
    case 'sum':
    case 'product': {
      const size = randomInt(random, 2, knobs.maxSize)
      const count = randomInt(random, knobs.minTerms, knobs.maxTerms)
      const prompt = { ask: knobs.ask, size, count }
      const key = `${String(size)}x${String(count)}`
      return knobs.ask === 'sum'
        ? make(key, prompt, numberAnswer(size * count, knobs.maxSize * knobs.maxTerms))
        : make(key, prompt, numberAnswer(count, Math.max(knobs.maxTerms, 10)))
    }
    case 'plates': {
      const groups = randomInt(random, 2, knobs.maxGroups)
      const size = randomInt(random, 2, knobs.maxSize)
      return make(
        `${String(groups)}x${String(size)}`,
        { ask: 'plates', groups, size },
        numberAnswer(groups * size, knobs.maxGroups * knobs.maxSize),
      )
    }
    case 'array': {
      const rows = randomInt(random, 2, knobs.maxRows)
      const columns = randomInt(random, 2, knobs.maxColumns)
      return make(
        `${String(rows)}x${String(columns)}`,
        { ask: 'array', rows, columns },
        numberAnswer(rows * columns, knobs.maxRows * knobs.maxColumns),
      )
    }
    case 'commutative': {
      const [left, right] = commutative(knobs.maxFactor, random)
      const [a, b] = left
      const [c, d] = right
      const relation: Relation = a * b > c * d ? 'greater' : a * b < c * d ? 'less' : 'equal'
      return make(
        `${String(a)}x${String(b)}?${String(c)}x${String(d)}`,
        { ask: 'commutative', left, right },
        choiceAnswer(relation, RELATIONS),
      )
    }
    case 'share': {
      const [plates, each] = pick(random, shares(knobs.max))
      const total = plates * each
      return make(
        `${String(total)}/${String(plates)}`,
        { ask: 'share', total, groups: plates },
        numberAnswer(each, knobs.max),
      )
    }
    case 'measure-out': {
      const [plates, each] = pick(random, shares(knobs.max))
      const total = plates * each
      return make(
        `${String(total)}/${String(each)}`,
        { ask: 'measure-out', total, size: each },
        numberAnswer(plates, knobs.max),
      )
    }
  }
}

/**
 * Two different factors on the left. Half the time the right side is the same
 * two swapped; otherwise one factor of either order moved by one, so the
 * products differ.
 */
function commutative(
  maxFactor: number,
  random: Random,
): readonly [readonly [number, number], readonly [number, number]] {
  const a = randomInt(random, 2, maxFactor)
  const b = pick(
    random,
    Array.from({ length: maxFactor - 1 }, (_, i) => i + 2).filter((n) => n !== a),
  )
  if (chance(random, 0.5))
    return [
      [a, b],
      [b, a],
    ]
  const nudged: [number, number][] = [
    [b + 1, a],
    [b - 1, a],
    [b, a + 1],
    [b, a - 1],
    [a + 1, b],
    [a - 1, b],
    [a, b + 1],
    [a, b - 1],
  ]
  const fits = nudged.filter(([c, d]) => c >= 2 && d >= 2 && c <= maxFactor && d <= maxFactor)
  return [[a, b], pick(random, fits)]
}

/** Every plates-and-candies-each pair that fits: two to five plates, two or more on each. */
function shares(max: number): readonly (readonly [number, number])[] {
  const pairs: [number, number][] = []
  for (let plates = 2; plates <= MOST_PLATES; plates++) {
    for (let each = SMALLEST_SHARE; plates * each <= max; each++) pairs.push([plates, each])
  }
  return pairs
}
