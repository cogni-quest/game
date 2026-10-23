import {
  chance,
  pick,
  pickAnswer,
  numberAnswer,
  randomInt,
  type NumberAnswer,
  type PickAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { BondsKnobs } from './knobs'

/** A number, the empty box for the answer, a sign, or «дес.» / «сот.» after the box. */
export type Token = number | 'blank' | '+' | '−' | '=' | 'tens' | 'hundreds'

/** One part of the house: a number or the empty box. */
export type Room = number | 'blank'

export type BondsPrompt =
  | { readonly show: 'house'; readonly whole: number; readonly parts: readonly [Room, Room] }
  | { readonly show: 'pairs'; readonly whole: number }
  | { readonly show: 'line'; readonly tokens: readonly Token[] }

export type BondsAnswer = NumberAnswer | PickAnswer
export type BondsTask = Task<BondsPrompt, BondsAnswer>

export const PLUGIN_ID = 'bonds'

export function isBondsTask(task: Task): task is BondsTask {
  return task.pluginId === PLUGIN_ID
}

const TEN = 10

export function generateBonds(knobs: BondsKnobs, random: Random): BondsTask {
  const { form, min, max } = knobs
  if (form === 'count-tens' || form === 'count-hundreds' || form === 'expand' || form === 'drop') {
    return byPlace(form, min, max, random)
  }
  const whole = randomInt(random, min, max)
  const upTo = Math.max(max, TEN)

  if (form === 'all-pairs') return allPairs(randomInt(random, min, max), random)

  if (form === 'house') {
    const left = randomInt(random, 1, whole - 1)
    const right = whole - left
    const leftEmpty = chance(random, 0.5)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `bond:${String(whole)}=${leftEmpty ? '□' : String(left)}+${leftEmpty ? String(right) : '□'}`,
      prompt: {
        show: 'house',
        whole,
        parts: leftEmpty ? ['blank', right] : [left, 'blank'],
      },
      answer: numberAnswer(leftEmpty ? left : right, upTo),
    }
  }

  const ones = whole - TEN
  const [tokens, expected] = ((): readonly [Token[], number] => {
    switch (form) {
      case 'tens':
        return chance(random, 0.5)
          ? [[whole, '=', TEN, '+', 'blank'], ones]
          : [['blank', '=', TEN, '+', ones], whole]
      case 'ten-plus':
        return chance(random, 0.5)
          ? [[TEN, '+', ones, '=', 'blank'], whole]
          : [[ones, '+', TEN, '=', 'blank'], whole]
      case 'minus-ones':
        return [[whole, '−', ones, '=', 'blank'], TEN]
      case 'minus-ten':
        return [[whole, '−', TEN, '=', 'blank'], ones]
    }
  })()
  return line(tokens, expected, upTo)
}

function line(tokens: Token[], expected: number, upTo: number): BondsTask {
  return {
    pluginId: PLUGIN_ID,
    itemKey: `bond:${tokens.map((t) => (t === 'blank' ? '□' : String(t))).join('')}`,
    prompt: { show: 'line', tokens },
    answer: numberAnswer(expected, upTo),
  }
}

/** The places of a number, biggest first, leaving out the empty ones: 347 → 300, 40, 7. */
function places(n: number): number[] {
  return [Math.floor(n / 100) * 100, Math.floor((n % 100) / 10) * 10, n % 10].filter((p) => p > 0)
}

function inRange(min: number, max: number, fits: (n: number) => boolean): number[] {
  const numbers: number[] = []
  for (let n = Math.max(min, TEN); n <= max; n++) if (fits(n)) numbers.push(n)
  return numbers
}

/** «40 = □ дес.», «347 = 300 + 40 + □», «35 − 30 = □». */
function byPlace(
  form: 'count-tens' | 'count-hundreds' | 'expand' | 'drop',
  min: number,
  max: number,
  random: Random,
): BondsTask {
  const upTo = Math.max(max, 100)
  switch (form) {
    case 'count-tens': {
      const whole = pick(
        random,
        inRange(min, max, (n) => n % TEN === 0),
      )
      return line([whole, '=', 'blank', 'tens'], whole / TEN, upTo)
    }
    case 'count-hundreds': {
      const whole = pick(
        random,
        inRange(min, max, (n) => n % 100 === 0),
      )
      return line([whole, '=', 'blank', 'hundreds'], whole / 100, upTo)
    }
    case 'expand': {
      // Every place present, so no part of the sum is a zero to be left out.
      const whole = pick(
        random,
        inRange(min, max, (n) => places(n).length === String(n).length),
      )
      const parts = places(whole)
      const empty = randomInt(random, 0, parts.length - 1)
      const right = parts.flatMap((part, i): Token[] => [
        ...(i > 0 ? ['+' as const] : []),
        i === empty ? 'blank' : part,
      ])
      return line([whole, '=', ...right], parts[empty] ?? 0, upTo)
    }
    case 'drop': {
      const whole = pick(
        random,
        inRange(min, max, (n) => n < 100 && n % TEN !== 0 && n > 20),
      )
      const ones = whole % TEN
      const taken = chance(random, 0.5) ? whole - ones : ones
      return line([whole, '−', taken, '=', 'blank'], whole - taken, upTo)
    }
  }
}

/** How many sums are offered: some make the whole, the rest miss it by one. */
const RIGHT_PAIRS = 3
const WRONG_PAIRS = 3

/** «Какие пары дают 6?» — sums that make the whole, among sums one off it. */
function allPairs(whole: number, random: Random): BondsTask {
  const sums = (total: number) =>
    Array.from({ length: Math.max(total - 1, 0) }, (_, i) => [i + 1, total - i - 1] as const)
  const right = shuffled(random, sums(whole)).slice(0, RIGHT_PAIRS)
  const wrong = shuffled(random, [...sums(whole - 1), ...sums(whole + 1)]).slice(0, WRONG_PAIRS)
  const offered = shuffled(random, [...right, ...wrong])
  const options = offered.map(([a, b]) => ({
    value: `${String(a)}+${String(b)}`,
    label: `${String(a)} + ${String(b)}`,
  }))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `bond:pairs:${String(whole)}:${options.map((o) => o.value).join(',')}`,
    prompt: { show: 'pairs', whole },
    answer: pickAnswer(
      options
        .filter((o) => right.some(([a, b]) => o.value === `${String(a)}+${String(b)}`))
        .map((o) => o.value),
      options,
    ),
  }
}

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = result[i]
    const b = result[j]
    if (a === undefined || b === undefined) throw new RangeError('shuffle out of range')
    result[i] = b
    result[j] = a
  }
  return result
}
