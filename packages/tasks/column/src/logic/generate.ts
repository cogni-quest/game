import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { ColumnKnobs, Op } from './knobs'

export interface ColumnPrompt {
  readonly op: Op
  /** Written on top. */
  readonly a: number
  /** Written below, with the sign. */
  readonly b: number
}

export type ColumnTask = Task<ColumnPrompt, NumberAnswer>

export const PLUGIN_ID = 'column'

export function isColumnTask(task: Task): task is ColumnTask {
  return task.pluginId === PLUGIN_ID
}

const MAX_RESULT = 999
const TRIES = 10_000

export function resultOf({ op, a, b }: ColumnPrompt): number {
  return op === 'add' ? a + b : a - b
}

/** Whether any place carries a ten when adding, or borrows one when subtracting. */
export function regroups({ op, a, b }: ColumnPrompt): boolean {
  let x = a
  let y = b
  let carried = 0
  while (x > 0 || y > 0) {
    const place = op === 'add' ? (x % 10) + (y % 10) + carried : (x % 10) - (y % 10) - carried
    carried = op === 'add' ? Number(place >= 10) : Number(place < 0)
    if (carried === 1) return true
    x = Math.floor(x / 10)
    y = Math.floor(y / 10)
  }
  return false
}

export function generateColumn({ op, carry, digits }: ColumnKnobs, random: Random): ColumnTask {
  const low = 10 ** (digits - 1)
  const high = 10 ** digits - 1
  for (let i = 0; i < TRIES; i++) {
    const a = randomInt(random, low, high)
    const b = randomInt(random, low, op === 'add' ? high : Math.max(low, a - 1))
    const prompt = { op, a, b }
    const result = resultOf(prompt)
    if (result >= 1 && result <= MAX_RESULT && regroups(prompt) === carry) {
      return {
        pluginId: PLUGIN_ID,
        itemKey: `col:${String(a)}${op === 'add' ? '+' : '-'}${String(b)}`,
        prompt,
        answer: numberAnswer(result, MAX_RESULT),
      }
    }
  }
  throw new RangeError('No column example fits these knobs')
}
