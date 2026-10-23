import {
  chance,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { RomanKnobs } from './knobs'

export interface RomanPrompt {
  readonly numeral: string
}

export type RomanTask = Task<RomanPrompt, NumberAnswer>

export const PLUGIN_ID = 'roman'

export function isRomanTask(task: Task): task is RomanTask {
  return task.pluginId === PLUGIN_ID
}

const DIGITS = [
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
] as const

/** 14 → XIV, 39 → XXXIX, 40 → XL. */
export function toRoman(n: number): string {
  let rest = n
  let numeral = ''
  for (const [value, letters] of DIGITS) {
    while (rest >= value) {
      numeral += letters
      rest -= value
    }
  }
  return numeral
}

/** The section before: numbers above it are what this section adds. */
const BOUNDS = [20, 10] as const
const ABOVE_SHARE = 2 / 3

export function generateRoman({ max }: RomanKnobs, random: Random): RomanTask {
  const below = BOUNDS.find((bound) => bound < max) ?? 0
  const n =
    below > 0 && chance(random, ABOVE_SHARE)
      ? randomInt(random, below + 1, max)
      : randomInt(random, 1, below > 0 ? below : max)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `rom:${String(n)}`,
    prompt: { numeral: toRoman(n) },
    answer: numberAnswer(n, max),
  }
}
