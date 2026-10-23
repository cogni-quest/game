import { chance, numberAnswer, pick, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { Ask, RemainderKnobs } from './knobs'

export interface RemainderPrompt {
  readonly show: RemainderKnobs['show']
  readonly ask: Ask
  readonly dividend: number
  readonly divisor: number
  /** Both parts of the answer: the one asked is the box, the other is shown. */
  readonly quotient: number
  readonly remainder: number
}

export type RemainderTask = Task<RemainderPrompt, NumberAnswer>

export const PLUGIN_ID = 'remainder'

export function isRemainderTask(task: Task): task is RemainderTask {
  return task.pluginId === PLUGIN_ID
}

/** Every dividend up to `max` and divisor 2…9 that leave a remainder. */
function divisions(max: number): [number, number][] {
  const found: [number, number][] = []
  for (let divisor = 2; divisor <= 9; divisor++) {
    for (let dividend = divisor + 1; dividend <= max; dividend++) {
      if (dividend % divisor !== 0) found.push([dividend, divisor])
    }
  }
  return found
}

export function generateRemainder(
  { show, max, ask: asked }: RemainderKnobs,
  random: Random,
): RemainderTask {
  const [dividend, divisor] = pick(random, divisions(max))
  const quotient = Math.floor(dividend / divisor)
  const remainder = dividend % divisor
  const ask: Ask = asked ?? (chance(random, 0.5) ? 'quotient' : 'remainder')
  return {
    pluginId: PLUGIN_ID,
    itemKey: `rem:${String(dividend)}:${String(divisor)}${ask === 'quotient' ? 'q' : 'r'}${show === 'picture' ? 'p' : ''}`,
    prompt: { show, ask, dividend, divisor, quotient, remainder },
    answer: numberAnswer(ask === 'quotient' ? quotient : remainder, max),
  }
}
