import {
  chance,
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { Ask, LengthCompareKnobs } from './knobs'

/** The red strip is drawn on top, the blue one below. */
export type Answer = 'red' | 'blue' | 'same'

/** Where a strip starts and how long it is, in centimetres. */
export interface Strip {
  readonly start: number
  readonly length: number
}

export interface LengthComparePrompt {
  readonly ask: Ask
  readonly red: Strip
  readonly blue: Strip
}

export type LengthCompareTask = Task<LengthComparePrompt, ChoiceAnswer<Answer>>

export const PLUGIN_ID = 'length-compare'

export function isLengthCompareTask(task: Task): task is LengthCompareTask {
  return task.pluginId === PLUGIN_ID
}

export const SHORTEST = 3
export const LONGEST = 14
export const MAX_SHIFT = 3
const FAR = 4
/** How often a section with `equal` draws two strips of the same length. */
const EQUAL_SHARE = 0.25

const STRIPS = [
  { value: 'red', label: 'красная' },
  { value: 'blue', label: 'синяя' },
] as const
const SAME = { value: 'same', label: '= одинаковые' } as const

export function generateLengthCompare(
  knobs: LengthCompareKnobs,
  random: Random,
): LengthCompareTask {
  const [red, blue] =
    knobs.equal === true && chance(random, EQUAL_SHARE) ? same(random) : pair(knobs.gap, random)
  const shift = knobs.shifted === true ? randomInt(random, 1, MAX_SHIFT) : 0
  const [redStart, blueStart] = chance(random, 0.5) ? [shift, 0] : [0, shift]
  const expected: Answer =
    red === blue ? 'same' : red > blue === (knobs.ask === 'longer') ? 'red' : 'blue'
  const asked = knobs.ask === 'longer' ? 'L>' : 'L<'
  const offered = knobs.equal === true ? '=' : ''
  return {
    pluginId: PLUGIN_ID,
    itemKey: `${asked}${offered}${String(redStart)}+${String(red)}/${String(blueStart)}+${String(blue)}`,
    prompt: {
      ask: knobs.ask,
      red: { start: redStart, length: red },
      blue: { start: blueStart, length: blue },
    },
    answer: choiceAnswer(expected, knobs.equal === true ? [...STRIPS, SAME] : STRIPS),
  }
}

function same(random: Random): readonly [number, number] {
  const length = randomInt(random, SHORTEST, LONGEST)
  return [length, length]
}

/** Two different lengths that fit the gap, in either order. */
function pair(gap: LengthCompareKnobs['gap'], random: Random): readonly [number, number] {
  const pairs: [number, number][] = []
  for (let a = SHORTEST; a <= LONGEST; a++) {
    for (let b = SHORTEST; b <= LONGEST; b++) {
      const apart = Math.abs(a - b)
      const fits =
        apart > 0 &&
        (gap === 'any' || (gap === 'far' && apart >= FAR) || (gap === 'near' && apart === 1))
      if (fits) pairs.push([a, b])
    }
  }
  return pick(random, pairs)
}
