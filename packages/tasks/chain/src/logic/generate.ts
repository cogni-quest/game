import {
  chance,
  choiceAnswer,
  numberAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import { fits, tokensOf, valueOf, written, type Op, type Span, type Token } from './expression'
import type { ChainKnobs } from './knobs'

export interface ChainPrompt {
  readonly ask: ChainKnobs['ask']
  /** `7 + 2 − 5 = □`, or for «где скобки?» `20 − 5 + 3 = 12` without brackets. */
  readonly tokens: readonly Token[]
}

export type ChainAnswer = NumberAnswer | ChoiceAnswer
export type ChainTask = Task<ChainPrompt, ChainAnswer>

export const PLUGIN_ID = 'chain'

export function isChainTask(task: Task): task is ChainTask {
  return task.pluginId === PLUGIN_ID
}

/** Every way to put brackets that changes nothing but the order. */
const PLACEMENTS: Record<3 | 4, readonly (readonly Span[])[]> = {
  3: [[[0, 1]], [[1, 2]]],
  4: [
    [[0, 1]],
    [[1, 2]],
    [[2, 3]],
    [[0, 2]],
    [[1, 3]],
    [
      [0, 1],
      [2, 3],
    ],
  ],
}

/** The brackets of `value` with brackets: never round the first term. */
const INNER: Record<3 | 4, readonly Span[]> = {
  3: [[1, 2]],
  4: [
    [1, 2],
    [2, 3],
    [1, 3],
  ],
}

const TRIES = 10_000

export function generateChain(knobs: ChainKnobs, random: Random): ChainTask {
  const { terms, max } = knobs
  for (let i = 0; i < TRIES; i++) {
    const numbers = Array.from({ length: terms }, () => randomInt(random, 1, max - 1))
    const convenient = knobs.ask === 'value' && knobs.convenient === true
    const ops: Op[] = Array.from({ length: terms - 1 }, () =>
      convenient || chance(random, 0.5) ? '+' : '−',
    )
    const task =
      knobs.ask === 'brackets'
        ? brackets(numbers, ops, knobs, random)
        : value(numbers, ops, knobs, random)
    if (task) return task
  }
  throw new RangeError(`No chain of ${String(terms)} numbers up to ${String(max)} fits`)
}

function value(
  numbers: readonly number[],
  ops: readonly Op[],
  knobs: Extract<ChainKnobs, { ask: 'value' }>,
  random: Random,
): ChainTask | undefined {
  const spans: Span[] = knobs.brackets === true ? [pick(random, INNER[knobs.terms])] : []
  if (!fits(numbers, ops, spans, knobs.max)) return undefined
  if (spans.length > 0 && valueOf(numbers, ops, spans) === valueOf(numbers, ops, [])) {
    return undefined
  }
  if (knobs.convenient === true && !roundPair(numbers)) return undefined
  const tokens: Token[] = [...tokensOf(numbers, ops, spans), '=', 'blank']
  return {
    pluginId: PLUGIN_ID,
    itemKey: `chain:${written(tokens)}`,
    prompt: { ask: 'value', tokens },
    answer: numberAnswer(valueOf(numbers, ops, spans), knobs.max),
  }
}

/** No term is round, and two of them make a round ten together. */
function roundPair(numbers: readonly number[]): boolean {
  if (numbers.some((n) => n % 10 === 0)) return false
  return numbers.some((a, i) => numbers.some((b, j) => j > i && (a + b) % 10 === 0))
}

function brackets(
  numbers: readonly number[],
  ops: readonly Op[],
  { terms, max }: ChainKnobs,
  random: Random,
): ChainTask | undefined {
  // The placements that stay in range, one per value: two that give the same
  // result could not tell the child which is right.
  const byValue = new Map<number, readonly Span[]>()
  const repeated = new Set<number>()
  for (const spans of PLACEMENTS[terms]) {
    if (!fits(numbers, ops, spans, max)) continue
    const v = valueOf(numbers, ops, spans)
    if (byValue.has(v)) repeated.add(v)
    else byValue.set(v, spans)
  }
  const options = [...byValue].filter(([v]) => !repeated.has(v))
  if (options.length < 2) return undefined
  const shown = options.slice(0, 4)
  const [result, right] = pick(random, shown)
  const id = (spans: readonly Span[]) =>
    spans.map(([a, b]) => `${String(a)}-${String(b)}`).join('_')
  const tokens: Token[] = [...tokensOf(numbers, ops, []), '=', result]
  return {
    pluginId: PLUGIN_ID,
    itemKey: `chainb:${written(tokens)}`,
    prompt: { ask: 'brackets', tokens },
    answer: choiceAnswer(
      id(right),
      shown.map(([, spans]) => ({
        value: id(spans),
        label: written(tokensOf(numbers, ops, spans)),
      })),
    ),
  }
}
