import {
  chance,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { DifferenceKnobs } from './knobs'

export interface DifferencePrompt {
  readonly show: DifferenceKnobs['show']
  /** The red row on top, the blue one below; never the same. */
  readonly red: number
  readonly blue: number
  /** «На сколько больше» is asked of the bigger side, «меньше» of the smaller. */
  readonly ask: 'more' | 'less'
}

export type DifferenceTask = Task<DifferencePrompt, NumberAnswer>

export const PLUGIN_ID = 'difference'

export function isDifferenceTask(task: Task): task is DifferenceTask {
  return task.pluginId === PLUGIN_ID
}

export function generateDifference(
  { show, min = 2, max }: DifferenceKnobs,
  random: Random,
): DifferenceTask {
  const bigger = randomInt(random, min, max)
  const smaller = randomInt(random, 1, bigger - 1)
  const [red, blue] = chance(random, 0.5) ? [bigger, smaller] : [smaller, bigger]
  const ask = chance(random, 0.5) ? 'more' : 'less'
  return {
    pluginId: PLUGIN_ID,
    itemKey: `diff:${show === 'picture' ? 'p' : 'n'}${ask}:${String(red)}/${String(blue)}`,
    prompt: { show, red, blue, ask },
    answer: numberAnswer(bigger - smaller, max),
  }
}
