import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { RulerKnobs } from './knobs'

export interface RulerPrompt {
  /** The ruler runs from zero to this many centimetres. */
  readonly ruler: number
  readonly start: number
  readonly length: number
}

export type RulerTask = Task<RulerPrompt, NumberAnswer>

export const PLUGIN_ID = 'ruler'

export function isRulerTask(task: Task): task is RulerTask {
  return task.pluginId === PLUGIN_ID
}

export function generateRuler({ min, max, from }: RulerKnobs, random: Random): RulerTask {
  const start = from === 'zero' ? 0 : randomInt(random, 1, max - min)
  const length = randomInt(random, min, max - start)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `ruler${String(max)}:${String(start)}+${String(length)}`,
    prompt: { ruler: max, start, length },
    answer: numberAnswer(length, max),
  }
}
