import {
  chance,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import { apart, overlapping, type Apart, type Lines, type Target } from './figures'
import type { OlympiadKnobs } from './knobs'
import { THINGS, type ThingId } from './things'

/** Some things on one pan of the scales. */
export interface Pan {
  readonly thing: ThingId
  readonly count: number
}

/** Scales in equilibrium: the left pan weighs what the right one does. */
export interface Scale {
  readonly left: Pan
  readonly right: Pan
}

export type OlympiadPrompt =
  | {
      readonly ask: 'figures'
      readonly target: Target
      readonly drawing: Lines | Apart
    }
  | {
      readonly ask: 'weighing'
      readonly scales: readonly Scale[]
      /** «Сколько `of` весят столько же, сколько `against`?» */
      readonly of: ThingId
      readonly against: Pan
    }

export type OlympiadTask = Task<OlympiadPrompt, NumberAnswer>

export const PLUGIN_ID = 'olympiad'

export function isOlympiadTask(task: Task): task is OlympiadTask {
  return task.pluginId === PLUGIN_ID
}

const FIGURES_UP_TO = 20
const WEIGHING_UP_TO = 30

export function generateOlympiad(knobs: OlympiadKnobs, random: Random): OlympiadTask {
  if (knobs.ask === 'figures') {
    const figures = knobs.overlap ? overlapping(random) : apart(random)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `oly:figures:${figures.key}`,
      prompt: { ask: 'figures', target: figures.target, drawing: figures.drawing },
      answer: numberAnswer(figures.expected, FIGURES_UP_TO),
    }
  }
  return knobs.chain === 1 ? oneSwap(random) : twoSwaps(random)
}

/** Things of decreasing weight, `n` of them, drawn in the order of THINGS. */
function heavierFirst(random: Random, n: number): ThingId[] {
  const ids = THINGS.map((t) => t.id)
  const chosen: ThingId[] = []
  let from = 0
  for (let i = 0; i < n; i++) {
    const at = randomInt(random, from, ids.length - (n - i))
    chosen.push(ids[at] ?? 'apple')
    from = at + 1
  }
  return chosen
}

/**
 * «1 арбуз весит как 3 дыни. Сколько дынь весят как 2 арбуза?» — or the other
 * way: «2 арбуза весят как 6 дынь. Сколько дынь весят как 1 арбуз?».
 */
function oneSwap(random: Random): OlympiadTask {
  const [big = 'watermelon', small = 'melon'] = heavierFirst(random, 2)
  const k = randomInt(random, 2, 5)
  if (chance(random, 0.5)) {
    const m = randomInt(random, 2, 5)
    return weighing(
      `1:${String(k)}x${String(m)}`,
      [{ left: { thing: big, count: 1 }, right: { thing: small, count: k } }],
      small,
      { thing: big, count: m },
      k * m,
    )
  }
  const m = randomInt(random, 2, 4)
  return weighing(
    `1u:${String(m)}x${String(k)}`,
    [{ left: { thing: big, count: m }, right: { thing: small, count: m * k } }],
    small,
    { thing: big, count: 1 },
    k,
  )
}

/** «1 арбуз = 2 дыни, 1 дыня = 3 яблока. Сколько яблок весят как 1 арбуз?» */
function twoSwaps(random: Random): OlympiadTask {
  const [big = 'watermelon', middle = 'melon', small = 'apple'] = heavierFirst(random, 3)
  const first = randomInt(random, 2, 5)
  const second = randomInt(random, 2, 5)
  return weighing(
    `2:${String(first)}x${String(second)}`,
    [
      { left: { thing: big, count: 1 }, right: { thing: middle, count: first } },
      { left: { thing: middle, count: 1 }, right: { thing: small, count: second } },
    ],
    small,
    { thing: big, count: 1 },
    first * second,
  )
}

function weighing(
  key: string,
  scales: Scale[],
  of: ThingId,
  against: Pan,
  expected: number,
): OlympiadTask {
  return {
    pluginId: PLUGIN_ID,
    itemKey: `oly:weighing:${key}`,
    prompt: { ask: 'weighing', scales, of, against },
    answer: numberAnswer(expected, WEIGHING_UP_TO),
  }
}
