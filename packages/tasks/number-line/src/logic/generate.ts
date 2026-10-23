import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { NumberLineKnobs } from './knobs'

export interface NumberLinePrompt {
  readonly min: number
  readonly max: number
  readonly step: number
  /** The marks that carry their number; the arrow's mark never does. */
  readonly signed: readonly number[]
  readonly arrow: number
}

export type NumberLineTask = Task<NumberLinePrompt, NumberAnswer>

export const PLUGIN_ID = 'number-line'

export function isNumberLineTask(task: Task): task is NumberLineTask {
  return task.pluginId === PLUGIN_ID
}

export function generateNumberLine(
  { min, max, step = 1, labels }: NumberLineKnobs,
  random: Random,
): NumberLineTask {
  const arrow = min + randomInt(random, 1, (max - min) / step - 1) * step
  const signed: number[] = []
  for (let n = min; n <= max; n += step) {
    const shown =
      labels === 'all' ||
      n === min ||
      n === max ||
      (labels === 'every-2' && ((n - min) / step) % 2 === 0) ||
      (labels === 'tens' && n % 10 === 0)
    if (shown && n !== arrow) signed.push(n)
  }
  return {
    pluginId: PLUGIN_ID,
    itemKey: `line:${labels}:${String(min)}-${String(max)}/${String(step)}:${String(arrow)}`,
    prompt: { min, max, step, signed, arrow },
    answer: numberAnswer(arrow, max),
  }
}
