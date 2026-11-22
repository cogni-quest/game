import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import {
  candidates,
  fits,
  FLOORS,
  generateSpyHouse,
  isSharp,
  narrowing,
  type Clue,
  type House,
  type SpyHouseTask,
} from './generate'
import type { SpyHouseKnobs } from './knobs'
import { spyHousePlugin } from './plugin'
import { reportSegments, spoken } from './words'

const SAMPLES = 1000

function sample(knobs: SpyHouseKnobs, seed = 17): SpyHouseTask[] {
  const random = createRandom(seed)
  return Array.from({ length: SAMPLES }, () => generateSpyHouse(knobs, random))
}

/** The sections of space.json. */
const KNOBS: readonly SpyHouseKnobs[] = [
  { windows: 1, recipes: [['floor']] },
  { windows: 2, recipes: [['floor', 'edge']] },
  { windows: 3, recipes: [['floor', 'edge']] },
  { windows: 4, landmarks: 7, recipes: [['floor', 'beside']] },
  {
    windows: 5,
    landmarks: 9,
    recipes: [
      ['floor', 'ordinal'],
      ['floor', 'between'],
      ['floor', 'beside'],
    ],
  },
  {
    windows: 5,
    landmarks: 9,
    recipes: [
      ['vertical', 'beside'],
      ['vertical', 'between'],
      ['vertical', 'ordinal'],
    ],
  },
]

const _ = null
const c = 'cat'
const k = 'cactus'
const t = 'teddy'

/** A 5 × 3 house to reason about by hand; top floor first. */
const HOUSE: House = [
  [_, c, _],
  [k, _, _],
  [_, _, c],
  [_, c, _],
  [t, _, k],
]

describe('the clues', () => {
  it('count floors from the ground', () => {
    expect(candidates(HOUSE, [{ kind: 'floor', floor: 1 }])).toEqual([{ row: 4, column: 1 }])
    expect(candidates(HOUSE, [{ kind: 'floor', floor: 5 }])).toEqual([
      { row: 0, column: 0 },
      { row: 0, column: 2 },
    ])
  })

  it('take left and right as the house is seen from the street', () => {
    const left = candidates(HOUSE, [{ kind: 'edge', edge: 'left' }])
    expect(left.every((cell) => cell.column === 0)).toBe(true)
    const right = candidates(HOUSE, [{ kind: 'edge', edge: 'right' }])
    expect(right.every((cell) => cell.column === 2)).toBe(true)
  })

  it('take «сразу слева от» as the very next window on the same floor', () => {
    // Cats at 0.1, 2.2, 3.1: the windows just left of them are 0.0, 2.1, 3.0.
    expect(candidates(HOUSE, [{ kind: 'beside', side: 'left', of: 'cat' }])).toEqual([
      { row: 0, column: 0 },
      { row: 2, column: 1 },
      { row: 3, column: 0 },
    ])
  })

  it('take «над» as a floor up, in the same column', () => {
    // Above the cat at 3.1 is 2.1; above the one at 2.2 is 1.2; the one at 0.1 has no floor above.
    expect(candidates(HOUSE, [{ kind: 'vertical', side: 'above', of: 'cat' }])).toEqual([
      { row: 1, column: 2 },
      { row: 2, column: 1 },
    ])
  })

  it('read «между» in either order', () => {
    const house: House = [[c, _, k]]
    const there = { row: 0, column: 1 }
    expect(fits(house, there, { kind: 'between', of: ['cat', 'cactus'] })).toBe(true)
    expect(fits(house, there, { kind: 'between', of: ['cactus', 'cat'] })).toBe(true)
    expect(fits(house, there, { kind: 'between', of: ['cat', 'teddy'] })).toBe(false)
  })

  it('never put the spy in a window that holds a landmark', () => {
    expect(fits(HOUSE, { row: 0, column: 1 }, { kind: 'floor', floor: 5 })).toBe(false)
  })

  it('call a report sharp only when it fits one window and needs every clue', () => {
    // Floor 2 has two empty windows, and three windows stand just left of a cat: only 3.0 is both.
    const floor: Clue = { kind: 'floor', floor: 2 }
    const beside: Clue = { kind: 'beside', side: 'left', of: 'cat' }
    expect(isSharp(HOUSE, [floor, beside])).toBe(true)
    // Floor 1 has one empty window: «в крайнем левом» would add nothing.
    expect(isSharp(HOUSE, [{ kind: 'floor', floor: 1 }])).toBe(true)
    expect(
      isSharp(HOUSE, [
        { kind: 'floor', floor: 1 },
        { kind: 'edge', edge: 'middle' },
      ]),
    ).toBe(false)
    expect(isSharp(HOUSE, [beside])).toBe(false)
  })
})

describe('generateSpyHouse', () => {
  it.each(KNOBS)('fits exactly one window, the right one, with no clue to spare: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const found = candidates(prompt.house, prompt.clues)
      return (
        found.length !== 1 ||
        !answer.isCorrect(found[0] ?? { row: -1, column: -1 }) ||
        !isSharp(prompt.house, prompt.clues)
      )
    })
    expect(wrong).toEqual([])
  })

  it.each(KNOBS)('builds the house asked for, with one recipe of clues: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const kinds = prompt.clues.map((clue) => clue.kind).join()
      const landmarks = prompt.house.flat().filter((w) => w !== null).length
      return (
        prompt.house.length !== FLOORS ||
        prompt.house.some((floor) => floor.length !== knobs.windows) ||
        !knobs.recipes.some((recipe) => recipe.join() === kinds) ||
        landmarks < (knobs.landmarks ?? 0) ||
        answer.rows !== FLOORS ||
        answer.columns !== knobs.windows
      )
    })
    expect(wrong).toEqual([])
  })

  it.each(KNOBS)('hides the spy on every floor and in every column: %j', (knobs) => {
    const tasks = sample(knobs)
    const rows = new Set(tasks.map((task) => task.answer.expected.row))
    const columns = new Set(tasks.map((task) => task.answer.expected.column))
    expect(rows.size).toBe(FLOORS)
    expect(columns.size).toBe(knobs.windows)
  })

  it('uses every recipe of a section', () => {
    const knobs = KNOBS[5]
    if (!knobs) throw new Error('no section')
    const used = new Set(sample(knobs).map((task) => task.prompt.clues[1]?.kind))
    expect(used).toEqual(new Set(['beside', 'between', 'ordinal']))
  })

  it('narrows the windows clue by clue down to the spy', () => {
    const [task] = sample({ windows: 4, landmarks: 7, recipes: [['floor', 'beside']] })
    if (!task) throw new Error('no task')
    const steps = narrowing(task.prompt.house, task.prompt.clues)
    expect(steps).toHaveLength(3)
    expect(steps.map((s) => s.length)).toEqual(
      [...steps.map((s) => s.length)].sort((a, b) => b - a),
    )
    expect(steps.at(-1)).toEqual([task.answer.expected])
  })
})

describe('spyHousePlugin', () => {
  it('reads the report aloud with the landmarks named', () => {
    const report = spoken(
      reportSegments(
        [
          { kind: 'floor', floor: 3 },
          { kind: 'beside', side: 'left', of: 'cat' },
        ],
        4,
      ),
    )
    expect(report).toBe('Шпион на 3 этаже, сразу слева от кота.')
    expect(
      spoken(
        reportSegments(
          [
            { kind: 'vertical', side: 'below', of: 'teddy' },
            { kind: 'between', of: ['cactus', 'cat'] },
          ],
          5,
        ),
      ),
    ).toBe('Шпион сразу под мишкой, между кактусом и котом.')
    expect(spoken(reportSegments([{ kind: 'ordinal', side: 'right', place: 2 }], 5))).toBe(
      'Шпион во втором окне справа.',
    )
  })

  it('says «в левом окне» on two windows and «в крайнем левом» on more', () => {
    expect(spoken(reportSegments([{ kind: 'edge', edge: 'left' }], 2))).toBe('Шпион в левом окне.')
    expect(spoken(reportSegments([{ kind: 'edge', edge: 'right' }], 3))).toBe(
      'Шпион в крайнем правом окне.',
    )
  })

  it('asks to find the window', () => {
    const task = spyHousePlugin.generateTyped({ windows: 1, recipes: [['floor']] }, createRandom(1))
    expect(spyHousePlugin.speak(task)).toMatch(/^Шпион на [1-5] этаже\. Найди его окно\.$/)
  })

  it.each([
    { windows: 0, recipes: [['floor']] },
    { windows: 6, recipes: [['floor']] },
    { windows: 3, recipes: [] },
    { windows: 3, recipes: [['floor', 'floor']] },
    { windows: 1, recipes: [['floor', 'edge']] },
    { windows: 3, recipes: [['floor', 'ordinal']] },
    { windows: 2, recipes: [['floor', 'between']], landmarks: 4 },
    { windows: 4, recipes: [['floor', 'beside']] },
    { windows: 4, recipes: [['floor', 'beside']], landmarks: 16 },
    { windows: 3, recipes: [['floor', 'sideways']] },
    { windows: 3 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => spyHousePlugin.generate(knobs, createRandom(1))).toThrow(/spy-house/)
  })
})
