import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { Ask, NeighboursKnobs } from './knobs'

/** One place in the row: a number, the blank for the answer, or a skipped place. */
export type Place = number | 'blank' | 'skip'

export interface NeighboursPrompt {
  readonly ask: Ask
  readonly shown: readonly Place[]
}

export type NeighboursTask = Task<NeighboursPrompt, NumberAnswer>

export const PLUGIN_ID = 'neighbours'

export function isNeighboursTask(task: Task): task is NeighboursTask {
  return task.pluginId === PLUGIN_ID
}

/**
 * How far the answer sits from the numbers shown: one place for the plain
 * neighbours, two for «через одно» — below the answer, above it, or both.
 */
const REACH: Record<Ask, { readonly below: number; readonly above: number }> = {
  next: { below: 1, above: 0 },
  previous: { below: 0, above: 1 },
  between: { below: 1, above: 1 },
  'skip-next': { below: 2, above: 0 },
  'skip-previous': { below: 0, above: 2 },
}

/** Every number from zero to `max` that fits appears as an answer; none falls outside. */
export function generateNeighbours({ max, ask }: NeighboursKnobs, random: Random): NeighboursTask {
  const { below, above } = REACH[ask]
  const answer = randomInt(random, below, max - above)
  const shown: Place[] = (() => {
    switch (ask) {
      case 'next':
        return [answer - 1, 'blank']
      case 'previous':
        return ['blank', answer + 1]
      case 'between':
        return [answer - 1, 'blank', answer + 1]
      case 'skip-next':
        return [answer - 2, 'skip', 'blank']
      case 'skip-previous':
        return ['blank', 'skip', answer + 2]
    }
  })()
  return {
    pluginId: PLUGIN_ID,
    itemKey: `${ask}:${String(answer)}`,
    prompt: { ask, shown },
    answer: numberAnswer(answer, Math.max(max, 10)),
  }
}
