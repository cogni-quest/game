import {
  chance,
  numberAnswer,
  pick,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { Kind, TimesKnobs } from './knobs'

/** A number, the empty box for the answer, or a sign. */
export type Token = number | 'blank' | '×' | ':' | '=' | ','

export interface TimesPrompt {
  readonly kind: Kind
  readonly tokens: readonly Token[]
}

export type TimesTask = Task<TimesPrompt, NumberAnswer>

export const PLUGIN_ID = 'times'

export function isTimesTask(task: Task): task is TimesTask {
  return task.pluginId === PLUGIN_ID
}

/** The other number of a table: by 1 and by 10 are their own kinds. */
const TABLE_FROM = 2
const TABLE_TO = 9
const LIMIT = 100

type Example = readonly [Token[], number]

const times = (a: number, b: number): Example => [[a, '×', b, '=', 'blank'], a * b]
const divided = (a: number, b: number): Example => [[a, ':', b, '=', 'blank'], a / b]
/** `a × b` or `b × a`, at random. */
const eitherWay = (random: Random, a: number, b: number): Example =>
  chance(random, 0.5) ? times(a, b) : times(b, a)

/** Every pair from the two ranges that `keep` lets through. */
function pairs(
  from: readonly [number, number],
  to: readonly [number, number],
  keep: (a: number, b: number) => boolean,
): [number, number][] {
  const found: [number, number][] = []
  for (let a = from[0]; a <= from[1]; a++) {
    for (let b = to[0]; b <= to[1]; b++) if (keep(a, b)) found.push([a, b])
  }
  return found
}

function example(knobs: TimesKnobs, random: Random): Example {
  const small = () => randomInt(random, 2, 10)
  switch (knobs.kind) {
    // Only the facts new to this table: `3 × 2` is already in the table of 2.
    case 'table-mul':
      return eitherWay(random, knobs.by, randomInt(random, knobs.by, TABLE_TO))
    case 'table-div':
      return divided(knobs.by * randomInt(random, TABLE_FROM, TABLE_TO), knobs.by)
    case 'by-1':
      return eitherWay(random, small(), 1)
    case 'by-0':
      return eitherWay(random, small(), 0)
    case 'by-10':
      return eitherWay(random, small(), 10)
    case 'div-1':
      return divided(small(), 1)
    case 'self': {
      const a = small()
      return divided(a, a)
    }
    case 'zero-div':
      return [[0, ':', small(), '=', 'blank'], 0]
    case 'div-10':
      return divided(small() * 10, 10)
    case 'round-mul': {
      const [tens, k] = pick(
        random,
        pairs([2, 9], [2, 9], (t, n) => t * 10 * n <= LIMIT),
      )
      return times(tens * 10, k)
    }
    case 'two-digit-mul': {
      const [a, k] = pick(
        random,
        pairs([11, 49], [2, 9], (n, m) => n % 10 !== 0 && n * m <= LIMIT),
      )
      return times(a, k)
    }
    case 'round-div': {
      // A round quotient: 60 : 3 = 20, 20 : 2 = 10.
      const [tens, d] = pick(
        random,
        pairs([1, 9], [2, 9], (t, n) => t * 10 * n <= LIMIT),
      )
      return divided(tens * 10 * d, d)
    }
    case 'round-by-round': {
      const [tens, q] = pick(
        random,
        pairs([2, 9], [2, 9], (t, n) => t * 10 * n <= LIMIT),
      )
      return divided(tens * 10 * q, tens * 10)
    }
    case 'sum-div': {
      const [q, d] = pick(
        random,
        pairs([11, 49], [2, 9], (n, m) => n * m < LIMIT && (n * m) % 10 !== 0),
      )
      return divided(q * d, d)
    }
    case 'guess-div': {
      const [d, q] = pick(
        random,
        pairs([11, 49], [2, 9], (n, m) => n % 10 !== 0 && n * m <= LIMIT),
      )
      return divided(d * q, d)
    }
    case 'times-10-100':
      return knobs.by === 10
        ? times(randomInt(random, 11, 99), 10)
        : times(randomInt(random, 2, 9), 100)
    case 'div-by-10':
      return divided(randomInt(random, 11, 99) * 10, 10)
    case 'skip':
      return skip(knobs.by, random)
  }
}

/** `2, 4, 6, □`: four or five terms, the box mostly last, sometimes inside. */
function skip(by: number, random: Random): Example {
  const terms = randomInt(random, 4, 5)
  const start = randomInt(random, 1, 10 - terms + 1)
  const row = Array.from({ length: terms }, (_, i) => (start + i) * by)
  const at = chance(random, 0.7) ? terms - 1 : randomInt(random, 1, terms - 2)
  const tokens = row.flatMap((n, i): Token[] => [
    ...(i === 0 ? [] : [',' as const]),
    i === at ? 'blank' : n,
  ])
  return [tokens, row[at] ?? 0]
}

export function generateTimes(knobs: TimesKnobs, random: Random): TimesTask {
  const [tokens, expected] = example(knobs, random)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `x:${tokens.map((t) => (t === 'blank' ? '□' : String(t))).join('')}`,
    prompt: { kind: knobs.kind, tokens },
    answer: numberAnswer(expected, expected <= LIMIT ? LIMIT : 1000),
  }
}
