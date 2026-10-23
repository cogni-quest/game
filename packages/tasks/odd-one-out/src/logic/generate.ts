import {
  chance,
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { By, OddOneOutKnobs } from './knobs'

export type Shape = 'circle' | 'square' | 'triangle' | 'star'
export type Colour = 'red' | 'blue' | 'green' | 'yellow'
export type Size = 'big' | 'small'

export type Item =
  | { readonly kind: 'figure'; readonly shape: Shape; readonly colour: Colour; readonly size: Size }
  | { readonly kind: 'word'; readonly text: string }
  | { readonly kind: 'number'; readonly value: number }

export interface OddOneOutPrompt {
  readonly by: By
  readonly items: readonly Item[]
}

/** The places in the row, counted from one. */
export type Place = '1' | '2' | '3' | '4'

export type OddOneOutTask = Task<OddOneOutPrompt, ChoiceAnswer<Place>>

export const PLUGIN_ID = 'odd-one-out'

export function isOddOneOutTask(task: Task): task is OddOneOutTask {
  return task.pluginId === PLUGIN_ID
}

export const PLACES = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
] as const

const SHAPES: readonly Shape[] = ['circle', 'square', 'triangle', 'star']
const COLOURS: readonly Colour[] = ['red', 'blue', 'green', 'yellow']

export const GROUPS: Readonly<Record<string, readonly string[]>> = {
  фрукты: ['яблоко', 'груша', 'слива', 'банан'],
  овощи: ['морковь', 'огурец', 'помидор', 'капуста'],
  животные: ['кошка', 'собака', 'корова', 'лошадь'],
  транспорт: ['машина', 'автобус', 'поезд', 'самолёт'],
}

const MAX_PARITY = 20
const MAX_MULTIPLE = 50
const DIVISORS = [3, 4, 5] as const

/** `count` different items, drawn from `from` without repeats. */
function distinct<T>(random: Random, from: readonly T[], count: number): T[] {
  const left = [...from]
  const chosen: T[] = []
  for (let i = 0; i < count; i++) {
    const item = pick(random, left)
    chosen.push(item)
    left.splice(left.indexOf(item), 1)
  }
  return chosen
}

const other = <T>(random: Random, from: readonly T[], not: T): T =>
  pick(
    random,
    from.filter((x) => x !== not),
  )

const numbersUpTo = (max: number, fits: (n: number) => boolean) =>
  Array.from({ length: max }, (_, i) => i + 1).filter(fits)

/** Three items that belong together and the one that does not. */
function draw(by: By, random: Random): readonly [Item[], Item] {
  switch (by) {
    case 'shape': {
      const colour = pick(random, COLOURS)
      const shape = pick(random, SHAPES)
      const figure = (s: Shape): Item => ({ kind: 'figure', shape: s, colour, size: 'big' })
      return [[figure(shape), figure(shape), figure(shape)], figure(other(random, SHAPES, shape))]
    }
    case 'colour-size': {
      const shape = pick(random, SHAPES)
      const colour = pick(random, COLOURS)
      const size: Size = chance(random, 0.5) ? 'big' : 'small'
      const same: Item = { kind: 'figure', shape, colour, size }
      const odd: Item = chance(random, 0.5)
        ? { kind: 'figure', shape, colour: other(random, COLOURS, colour), size }
        : { kind: 'figure', shape, colour, size: size === 'big' ? 'small' : 'big' }
      return [[same, same, same], odd]
    }
    case 'meaning': {
      const names = Object.keys(GROUPS)
      const group = pick(random, names)
      const oddGroup = other(random, names, group)
      const words = distinct(random, GROUPS[group] ?? [], 3).map((text): Item => ({
        kind: 'word',
        text,
      }))
      return [words, { kind: 'word', text: pick(random, GROUPS[oddGroup] ?? []) }]
    }
    case 'parity': {
      const even = chance(random, 0.5)
      const same = numbersUpTo(MAX_PARITY, (n) => n % 2 === (even ? 0 : 1))
      const odd = numbersUpTo(MAX_PARITY, (n) => n % 2 === (even ? 1 : 0))
      return [
        distinct(random, same, 3).map((value): Item => ({ kind: 'number', value })),
        { kind: 'number', value: pick(random, odd) },
      ]
    }
    case 'multiple': {
      const k = pick(random, DIVISORS)
      const same = numbersUpTo(MAX_MULTIPLE, (n) => n % k === 0)
      const odd = numbersUpTo(MAX_MULTIPLE, (n) => n % k !== 0)
      // The three must also agree on the other divisors, or one of them would
      // stand out by its own rule: 12, 24, 20 are all fours, but 20 is no three.
      for (;;) {
        const three = distinct(random, same, 3)
        const agree = DIVISORS.every((d) => new Set(three.map((n) => n % d === 0)).size === 1)
        if (agree) {
          return [
            three.map((value): Item => ({ kind: 'number', value })),
            { kind: 'number', value: pick(random, odd) },
          ]
        }
      }
    }
  }
}

function keyOf(item: Item): string {
  switch (item.kind) {
    case 'figure':
      return `${item.shape}-${item.colour}-${item.size}`
    case 'word':
      return item.text
    case 'number':
      return String(item.value)
  }
}

export function generateOddOneOut({ by }: OddOneOutKnobs, random: Random): OddOneOutTask {
  const [same, odd] = draw(by, random)
  const at = randomInt(random, 0, 3)
  const items = [...same.slice(0, at), odd, ...same.slice(at)]
  const place = PLACES[at]?.value ?? '1'
  return {
    pluginId: PLUGIN_ID,
    itemKey: `odd:${by}:${items.map(keyOf).join(',')}`,
    prompt: { by, items },
    answer: choiceAnswer(place, PLACES),
  }
}
