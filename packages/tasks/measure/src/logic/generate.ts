import { numberAnswer, pick, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { MassKnobs, MeasureKnobs, VolumeKnobs } from './knobs'

/** What lies on the scales; the name is said and written under it. */
export const THINGS = {
  watermelon: { name: 'арбуз', colour: '#3a7d44' },
  pumpkin: { name: 'тыква', colour: '#e8833a' },
  bag: { name: 'сумка', colour: '#8a5a3b' },
  cabbage: { name: 'капуста', colour: '#9cc56b' },
} as const

export type Thing = keyof typeof THINGS

/**
 * Balanced scales: the thing and `left` weights on the left pan, `right`
 * weights on the right. Weights are in kilograms, heaviest first.
 */
export interface MassPrompt {
  readonly quantity: 'mass'
  readonly thing: Thing
  readonly left: readonly number[]
  readonly right: readonly number[]
}

/** Jars of water side by side, each holding this many litres, biggest first. */
export interface VolumePrompt {
  readonly quantity: 'volume'
  readonly jars: readonly number[]
}

export type MeasurePrompt = MassPrompt | VolumePrompt

export type MeasureTask = Task<MeasurePrompt, NumberAnswer>

export const PLUGIN_ID = 'measure'

export function isMeasureTask(task: Task): task is MeasureTask {
  return task.pluginId === PLUGIN_ID
}

/** Everything stays within the numbers to ten. */
export const MOST = 10
const LIGHTEST_THING = 2
/** More weights or jars than this do not fit on a pan or a shelf. */
const MOST_MIXED = 5

export function generateMeasure(knobs: MeasureKnobs, random: Random): MeasureTask {
  return knobs.quantity === 'mass' ? generateMass(knobs, random) : generateVolume(knobs, random)
}

function generateMass({ weights, balance }: MassKnobs, random: Random): MeasureTask {
  const ones = weights === 'ones'
  const rights = bags(ones ? [1] : [5, 2, 1], ones ? MOST : MOST_MIXED).filter(
    (bag) => ones || kinds(bag) >= 2,
  )
  const lefts = balance === true ? bags(ones ? [1] : [2, 1], 2) : [[]]
  const scales = lefts.flatMap((left) =>
    rights
      .filter((right) => sum(right) - sum(left) >= LIGHTEST_THING)
      .map((right) => ({ left, right })),
  )
  const { left, right } = pick(random, scales)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `kg:${left.join('+')}|${right.join('+')}`,
    prompt: {
      quantity: 'mass',
      thing: pick(random, Object.keys(THINGS) as Thing[]),
      left,
      right,
    },
    answer: numberAnswer(sum(right) - sum(left), MOST),
  }
}

function generateVolume({ jars }: VolumeKnobs, random: Random): MeasureTask {
  const same = jars === 'same'
  const shelves = bags(same ? [1] : [3, 2, 1], same ? MOST : MOST_MIXED).filter((bag) =>
    same ? bag.length >= 2 : kinds(bag) >= 2,
  )
  const shelf = pick(random, shelves)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `l:${shelf.join('+')}`,
    prompt: { quantity: 'volume', jars: shelf },
    answer: numberAnswer(sum(shelf), MOST),
  }
}

/**
 * Every non-empty handful of at most `count` pieces of the given sizes
 * (biggest first) that adds up to no more than ten, each listed biggest first.
 */
function bags(sizes: readonly number[], count: number): number[][] {
  const found: number[][] = []
  const grow = (bag: number[], from: number) => {
    if (bag.length > 0) found.push(bag)
    if (bag.length === count) return
    sizes.forEach((size, i) => {
      if (i >= from && sum(bag) + size <= MOST) grow([...bag, size], i)
    })
  }
  grow([], 0)
  return found
}

function sum(pieces: readonly number[]): number {
  return pieces.reduce((total, piece) => total + piece, 0)
}

function kinds(pieces: readonly number[]): number {
  return new Set(pieces).size
}
