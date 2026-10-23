import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { Blank, MissingKnobs } from './knobs'

/** A number, the unknown, or a sign. */
export type Token = number | 'blank' | '+' | '−' | '×' | '='

export interface MissingPrompt {
  readonly blank: Blank
  readonly tokens: readonly Token[]
  /** The unknown is written `x` rather than `□`. */
  readonly letter: boolean
}

export type MissingTask = Task<MissingPrompt, NumberAnswer>

export const PLUGIN_ID = 'missing'

export function isMissingTask(task: Task): task is MissingTask {
  return task.pluginId === PLUGIN_ID
}

const TIMES = 10

export function generateMissing(
  { blank, min = 2, max, by, letter }: MissingKnobs,
  random: Random,
): MissingTask {
  // The bigger number, then the two smaller ones that make it.
  const whole = randomInt(random, min, max)
  const a = randomInt(random, 1, whole - 1)
  const b = whole - a
  const [tokens, expected, upTo] = ((): readonly [Token[], number, number] => {
    switch (blank) {
      case 'second':
        return [[a, '+', 'blank', '=', whole], b, max]
      case 'first':
        return [['blank', '+', b, '=', whole], a, max]
      case 'subtrahend':
        return [[whole, '−', 'blank', '=', a], b, max]
      case 'minuend':
        return [['blank', '−', b, '=', a], whole, max]
      case 'factor': {
        const known = by ?? 2
        const other = randomInt(random, 2, TIMES)
        return [[known, '×', 'blank', '=', known * other], other, TIMES]
      }
    }
  })()
  const shown = letter === true ? 'x' : '□'
  return {
    pluginId: PLUGIN_ID,
    itemKey: `miss:${tokens.map((t) => (t === 'blank' ? shown : String(t))).join('')}`,
    prompt: { blank, tokens, letter: letter === true },
    answer: numberAnswer(expected, upTo),
  }
}
