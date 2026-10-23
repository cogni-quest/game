import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateOddOneOut, GROUPS, type Item } from './generate'
import type { By } from './knobs'
import { oddOneOutPlugin } from './plugin'

const SAMPLES = 1_000

function sample(by: By) {
  const random = createRandom(21)
  return Array.from({ length: SAMPLES }, () => generateOddOneOut({ by }, random))
}

/** What each item is judged by, worked out without the generator. */
const FEATURE: Record<By, (item: Item) => string> = {
  shape: (item) => (item.kind === 'figure' ? item.shape : ''),
  'colour-size': (item) => (item.kind === 'figure' ? `${item.colour}/${item.size}` : ''),
  meaning: (item) =>
    item.kind === 'word'
      ? (Object.entries(GROUPS).find(([, words]) => words.includes(item.text))?.[0] ?? '')
      : '',
  parity: (item) => (item.kind === 'number' ? String(item.value % 2) : ''),
  // Divisible by 3, by 4, by 5: the other three must agree on all of it.
  multiple: (item) =>
    item.kind === 'number' ? [3, 4, 5].map((d) => String(item.value % d === 0)).join() : '',
}

/** The one place where the other three agree and it differs from them, or -1. */
function oddPlace(by: By, items: readonly Item[]): number {
  const features = items.map((item) => FEATURE[by](item))
  const places = features.flatMap((feature, i) => {
    const rest = features.filter((_, j) => j !== i)
    return rest.every((r) => r === rest[0]) && feature !== rest[0] ? [i] : []
  })
  return places.length === 1 ? (places[0] ?? -1) : -1
}

describe('generateOddOneOut', () => {
  it.each<By>(['shape', 'colour-size', 'meaning', 'parity', 'multiple'])(
    '%s: exactly one item is odd, and it is the answer',
    (by) => {
      const wrong = sample(by).filter(({ prompt, answer }) => {
        const at = oddPlace(by, prompt.items)
        return prompt.items.length !== 4 || at < 0 || answer.expected !== String(at + 1)
      })
      expect(wrong).toEqual([])
    },
  )

  it('changes only one feature in colour-size', () => {
    const wrong = sample('colour-size').filter(({ prompt }) => {
      const figures = prompt.items.flatMap((i) => (i.kind === 'figure' ? [i] : []))
      const shapes = new Set(figures.map((f) => f.shape))
      const colours = new Set(figures.map((f) => f.colour))
      const sizes = new Set(figures.map((f) => f.size))
      return shapes.size !== 1 || colours.size + sizes.size !== 3
    })
    expect(wrong).toEqual([])
  })

  it('keeps numbers in range', () => {
    const over = (by: By, max: number) =>
      sample(by).filter(({ prompt }) =>
        prompt.items.some((i) => i.kind !== 'number' || i.value < 1 || i.value > max),
      )
    expect([...over('parity', 20), ...over('multiple', 50)]).toEqual([])
  })

  it('puts the odd one in every place', () => {
    const places = new Set(sample('shape').map((t) => t.answer.expected))
    expect(places).toEqual(new Set(['1', '2', '3', '4']))
  })

  it('offers the four places, the answer among them', () => {
    const task = generateOddOneOut({ by: 'meaning' }, createRandom(3))
    expect(task.answer.options.map((o) => o.value)).toEqual(['1', '2', '3', '4'])
    expect(oddOneOutPlugin.speak(task)).toBe('Что здесь лишнее?')
  })
})

describe('oddOneOutPlugin', () => {
  it.each([{ by: 'smell' }, {}, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => oddOneOutPlugin.generate(knobs, createRandom(1))).toThrow(/odd-one-out/)
  })
})
