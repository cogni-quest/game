import { describe, expect, it } from 'vitest'

import { numberAnswer, type NumberAnswer } from './answers/number'
import { defineTaskPlugin } from './definePlugin'
import { createRandom } from './random'
import { createRegistry, sectionRange, type Format, type Level } from './registry'

/** A plugin whose answer is simply the knob it was given. */
const echo = (id: string) =>
  defineTaskPlugin<number, string, NumberAnswer>({
    id,
    parseKnobs: (raw) => {
      if (typeof raw !== 'number') throw new TypeError('expected a number')
      return raw
    },
    generate: (knobs) => ({
      pluginId: id,
      itemKey: `${id}:${String(knobs)}`,
      prompt: `${String(knobs)}?`,
      answer: numberAnswer(knobs, 100),
    }),
    speak: (task) => task.prompt,
  })

const format = (plugin: string, knobs: unknown[], stars?: 1 | 2): Format => ({
  plugin,
  ...(stars === undefined ? {} : { stars }),
  sections: knobs.map((k) => ({ knobs: k })),
})

describe('sectionRange', () => {
  it.each([
    [
      8,
      [
        [0, 2],
        [2, 4],
        [4, 5],
        [5, 7],
        [7, 8],
      ],
    ],
    [
      6,
      [
        [0, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
    ],
    [
      5,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
      ],
    ],
    [
      3,
      [
        [0, 1],
        [1, 2],
        [1, 2],
        [2, 3],
        [2, 3],
      ],
    ],
    [
      1,
      [
        [0, 1],
        [0, 1],
        [0, 1],
        [0, 1],
        [0, 1],
      ],
    ],
  ])('levels 1–5 of %i sections each take their own band: %j', (count, expected) => {
    const levels = [1, 2, 3, 4, 5] as const
    expect(levels.map((level) => sectionRange(level, count))).toEqual(expected)
  })

  it('gives the boss only the last section', () => {
    expect(sectionRange('boss', 8)).toEqual([7, 8])
    expect(sectionRange('boss', 1)).toEqual([0, 1])
  })

  it('refuses a level outside 1–5 and a format without sections', () => {
    expect(() => sectionRange(0 as Level, 3)).toThrow(RangeError)
    expect(() => sectionRange(6 as Level, 3)).toThrow(RangeError)
    expect(() => sectionRange(1, 0)).toThrow(RangeError)
  })
})

/** The answers a few hundred tasks come back with. */
function answers(make: () => { answer: { expected: unknown } }): Set<unknown> {
  return new Set(Array.from({ length: 300 }, () => make().answer.expected))
}

describe('createRegistry', () => {
  it('asks each level only its own band', () => {
    const registry = createRegistry([echo('e')])
    const f = format('e', [10, 20, 30, 40, 50])
    const random = createRandom(1)
    expect(answers(() => registry.generateLevel(f, 1, random))).toEqual(new Set([10]))
    expect(answers(() => registry.generateLevel(f, 3, random))).toEqual(new Set([30]))
    expect(answers(() => registry.generateLevel(f, 5, random))).toEqual(new Set([50]))
  })

  it('asks the boss the hardest section when the step has no stars', () => {
    const registry = createRegistry([echo('e')])
    const s = { id: 'S', formats: [format('e', [10, 20])] }
    const random = createRandom(2)
    expect(answers(() => registry.generate(s, 'boss', random))).toEqual(new Set([20]))
  })

  it('gives the boss hard, ★ and ★★ tasks by their shares', () => {
    const registry = createRegistry([echo('e')])
    const s = {
      id: 'S',
      formats: [format('e', [10, 20]), format('e', [91, 92], 1), format('e', [99], 2)],
    }
    const random = createRandom(4)
    const seen = Array.from({ length: 2000 }, () => registry.generate(s, 'boss', random))
    const share = (values: number[]) =>
      seen.filter((t) => values.includes(t.answer.expected as number)).length / seen.length
    expect(share([10])).toBe(0)
    expect(share([20])).toBeCloseTo(0.5, 1)
    expect(share([91, 92])).toBeCloseTo(0.35, 1)
    expect(share([99])).toBeCloseTo(0.15, 1)
  })

  it('never gives a starred task to an ordinary monster', () => {
    const registry = createRegistry([echo('e')])
    const s = { id: 'S', formats: [format('e', [10, 20]), format('e', [91], 1)] }
    const random = createRandom(5)
    for (const tier of [1, 2, 3, 4, 5] as const) {
      expect(answers(() => registry.generate(s, tier, random)).has(91)).toBe(false)
    }
  })

  it('draws every format of a step', () => {
    const registry = createRegistry([echo('one'), echo('two')])
    const s = { id: 'S', formats: [format('one', [0]), format('two', [0])] }
    const random = createRandom(3)
    const seen = new Set(
      Array.from({ length: 100 }, () => registry.generate(s, 1, random).pluginId),
    )
    expect([...seen].sort()).toEqual(['one', 'two'])
  })

  it('generates an exact section', () => {
    const registry = createRegistry([echo('e')])
    const f = format('e', [1, 2])
    expect(registry.generateSection(f, 1, createRandom(1)).answer.expected).toBe(2)
    expect(() => registry.generateSection(f, 2, createRandom(1))).toThrow(RangeError)
  })

  it('names the plugin whose knobs do not fit', () => {
    const registry = createRegistry([echo('seven')])
    expect(() => registry.generateLevel(format('seven', ['wrong']), 1, createRandom(1))).toThrow(
      /seven/,
    )
  })

  it('refuses an unknown plugin, a duplicate id and an empty step', () => {
    const registry = createRegistry([echo('seven')])
    expect(() => registry.generateLevel(format('nine', [1]), 1, createRandom(1))).toThrow(/nine/)
    expect(() => createRegistry([echo('a'), echo('a')])).toThrow(/'a'/)
    expect(() => registry.generate({ id: 'S', formats: [] }, 1, createRandom(1))).toThrow(/'S'/)
  })
})
