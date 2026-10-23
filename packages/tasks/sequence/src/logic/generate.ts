import {
  chance,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { SequenceKnobs, Step } from './knobs'

/** A number of the row, or the empty box for the answer. */
export type Term = number | 'blank'

export interface SequencePrompt {
  readonly ask: SequenceKnobs['ask']
  readonly terms: readonly Term[]
}

export type SequenceTask = Task<SequencePrompt, NumberAnswer>

export const PLUGIN_ID = 'sequence'

export function isSequenceTask(task: Task): task is SequenceTask {
  return task.pluginId === PLUGIN_ID
}

/** The biggest number a row with this step may reach. */
const LIMIT: Record<Step, number> = { 1: 20, 2: 20, 5: 50, 10: 100, growing: 20 }

/** Five numbers in a row with a gap; four or five and the next one. */
const GAP_LENGTH = 5

export function generateSequence({ ask, step }: SequenceKnobs, random: Random): SequenceTask {
  const length = ask === 'gap' ? GAP_LENGTH : randomInt(random, 4, 5) + 1
  const numbers = row(step, length, random)
  const blank = ask === 'gap' ? randomInt(random, 1, GAP_LENGTH - 2) : length - 1
  const expected = numbers[blank] ?? 0
  const terms: Term[] = numbers.map((n, i) => (i === blank ? 'blank' : n))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `seq:${terms.map((t) => (t === 'blank' ? '□' : String(t))).join(',')}`,
    prompt: { ask, terms },
    answer: numberAnswer(expected, Math.max(LIMIT[step], expected)),
  }
}

/** `length` numbers with the step, all from zero to the step's limit. */
function row(step: Step, length: number, random: Random): number[] {
  const limit = LIMIT[step]
  if (step === 'growing') {
    const numbers = [randomInt(random, 1, 5)]
    for (let i = 1; i < length; i++) numbers.push((numbers[i - 1] ?? 0) + i)
    return numbers
  }
  const span = step * (length - 1)
  if (step === 5 || step === 10) {
    const first = step * randomInt(random, 1, (limit - span) / step)
    return Array.from({ length }, (_, i) => first + i * step)
  }
  const first = randomInt(random, 0, limit - span)
  const up = Array.from({ length }, (_, i) => first + i * step)
  return chance(random, 0.5) ? up : up.reverse()
}
