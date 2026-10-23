import {
  chance,
  numberAnswer,
  pick,
  pickAnswer,
  randomInt,
  type Forms,
  type NumberAnswer,
  type PickAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { MoneyKnobs } from './knobs'

export const COINS = [1, 2, 5, 10] as const
export const NOTES = [50, 100] as const

export const ROUBLES: Forms = ['рубль', 'рубля', 'рублей']

/** Is this amount a note rather than a coin? */
export function isNote(value: number): boolean {
  return (NOTES as readonly number[]).includes(value)
}

export type MoneyPrompt =
  /** Coins and notes, biggest first. */
  | { readonly ask: 'count'; readonly items: readonly number[] }
  | { readonly ask: 'change'; readonly price: number; readonly from: number }
  /** The sum to make and the purse to make it from, biggest first. */
  | { readonly ask: 'make'; readonly target: number; readonly purse: readonly number[] }

export type MoneyAnswer = NumberAnswer | PickAnswer
export type MoneyTask = Task<MoneyPrompt, MoneyAnswer>

export const PLUGIN_ID = 'money'

export function isMoneyTask(task: Task): task is MoneyTask {
  return task.pluginId === PLUGIN_ID
}

const MOST_ITEMS = 6
const TRIES = 10_000

export function generateMoney(knobs: MoneyKnobs, random: Random): MoneyTask {
  if (knobs.ask === 'make') return makeSum(knobs.max, random)
  if (knobs.ask === 'change') {
    const price = randomInt(random, 1, knobs.from - 1)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `money:change:${String(knobs.from)}-${String(price)}`,
      prompt: { ask: 'change', price, from: knobs.from },
      answer: numberAnswer(knobs.from - price, knobs.from),
    }
  }
  const items = countable(knobs.max, knobs.notes === true, random)
  const total = items.reduce((sum, value) => sum + value, 0)
  return {
    pluginId: PLUGIN_ID,
    itemKey: `money:count:${items.join('+')}`,
    prompt: { ask: 'count', items },
    answer: numberAnswer(total, knobs.max),
  }
}

/** Two to six coins (and a note, with `notes`) of two kinds or more, worth up to `max`. */
function countable(max: number, notes: boolean, random: Random): number[] {
  const coins = COINS.filter((value) => value < max)
  const bills = NOTES.filter((value) => value < max)
  if (notes && bills.length === 0) throw new RangeError(`No note fits under ${String(max)}`)
  for (let i = 0; i < TRIES; i++) {
    const count = randomInt(random, 2, MOST_ITEMS)
    const items = Array.from({ length: count }, (_, k) =>
      notes && (k === 0 || chance(random, 0.15)) ? pick(random, bills) : pick(random, coins),
    )
    const total = items.reduce((sum, value) => sum + value, 0)
    if (total <= max && new Set(items).size >= 2) return items.sort((a, b) => b - a)
  }
  throw new RangeError(`No coins fit under ${String(max)}`)
}

const PURSE = [5, 8] as const

/**
 * «Набери 8 рублей»: a purse, and a sum some of its coins make — never the
 * whole purse and never one coin alone. Any coins that make the sum are right.
 */
function makeSum(max: number, random: Random): MoneyTask {
  const kinds = max > 50 ? [...COINS, 50] : COINS.filter((value) => value < max)
  for (let i = 0; i < TRIES; i++) {
    const purse = Array.from({ length: randomInt(random, PURSE[0], PURSE[1]) }, () =>
      pick(random, kinds),
    ).sort((a, b) => b - a)
    const chosen = purse.map(() => chance(random, 0.4))
    const target = purse.reduce((sum, value, k) => sum + (chosen[k] === true ? value : 0), 0)
    const used = chosen.filter(Boolean).length
    if (used < 2 || used === purse.length || target > max) continue
    const options = purse.map((value, k) => ({
      value: `c${String(k)}`,
      label: `${String(value)} р.`,
    }))
    const worth = (given: readonly string[]) =>
      given.reduce((sum, v) => sum + (purse[Number(v.slice(1))] ?? Number.NaN), 0)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `money:make:${String(target)}/${purse.join('+')}`,
      prompt: { ask: 'make', target, purse },
      answer: pickAnswer(
        options.filter((_, k) => chosen[k] === true).map((o) => o.value),
        options,
        (given) => worth(given) === target,
      ),
    }
  }
  throw new RangeError(`No purse makes a sum up to ${String(max)}`)
}
