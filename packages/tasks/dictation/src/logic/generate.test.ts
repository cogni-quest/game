import { createRandom, type Cell } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { DELTA, generateDictation, walk, type DictationTask } from './generate'
import type { DictationKnobs } from './knobs'
import { dictationPlugin } from './plugin'

const SAMPLES = 300

function sample(knobs: DictationKnobs): DictationTask[] {
  const random = createRandom(17)
  return Array.from({ length: SAMPLES }, () => generateDictation(knobs, random))
}

const at = ({ row, column }: Cell) => `${String(row)}.${String(column)}`

/** The whole path, walked from the start, whichever end the prompt marks. */
function pathOf({ prompt, answer }: DictationTask): readonly Cell[] {
  return walk(prompt.ask === 'end' ? prompt.marked : answer.expected, prompt.moves)
}

/** The sections of attention.json, and a few more. */
const KNOBS: readonly DictationKnobs[] = [
  { size: 5, steps: 3, longest: 1 },
  { size: 6, steps: 5, longest: 1 },
  { size: 7, steps: 5, longest: 3 },
  { size: 8, steps: 7, longest: 4 },
  { size: 8, steps: 9, longest: 4, cross: true },
  { size: 8, steps: 11, longest: 4, cross: true },
  { size: 6, steps: 4, longest: 1, ask: 'start' },
  { size: 7, steps: 5, longest: 3, ask: 'start' },
  { size: 6, steps: 4, longest: 1, diagonal: true },
  { size: 8, steps: 6, longest: 3, diagonal: true },
]

describe('generateDictation', () => {
  it.each(KNOBS)('asks the cell the steps lead to, inside the grid: %j', (knobs) => {
    const wrong = sample(knobs).filter((task) => {
      const { prompt, answer } = task
      const path = pathOf(task)
      const inside = path.every(
        (c) => c.row >= 0 && c.row < knobs.size && c.column >= 0 && c.column < knobs.size,
      )
      const [first, last] = [path[0], path.at(-1)]
      const ends =
        knobs.ask === 'start'
          ? first && last && at(last) === at(prompt.marked) && at(first) === at(answer.expected)
          : last && at(last) === at(answer.expected)
      return !inside || ends !== true || prompt.moves.length !== knobs.steps
    })
    expect(wrong).toEqual([])
  })

  it.each(KNOBS)('turns at every step and stays within the longest step: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt }) =>
      prompt.moves.some((m, i) => {
        const before = prompt.moves[i - 1]
        const [a, b] = DELTA[m.direction]
        const [c, d] = before ? DELTA[before.direction] : [9, 9]
        return (
          m.count < 1 || m.count > knobs.longest || (a === c && b === d) || (a === -c && b === -d)
        )
      }),
    )
    expect(wrong).toEqual([])
  })

  it.each(KNOBS.filter((k) => k.cross === undefined))(
    'never passes a cell twice, unless asked to cross: %j',
    (knobs) => {
      const wrong = sample(knobs).filter((task) => {
        const path = pathOf(task)
        return new Set(path.map(at)).size !== path.length
      })
      expect(wrong).toEqual([])
    },
  )

  it('crosses itself when asked to, and never ends where it began', () => {
    const wrong = sample({ size: 8, steps: 9, longest: 4, cross: true }).filter((task) => {
      const path = pathOf(task)
      const first = path[0]
      const last = path.at(-1)
      return (
        new Set(path.map(at)).size === path.length ||
        (first !== undefined && last !== undefined && at(first) === at(last))
      )
    })
    expect(wrong).toEqual([])
  })

  it('uses only straight steps unless diagonals are asked, and diagonals when they are', () => {
    const straight = sample({ size: 7, steps: 5, longest: 3 }).flatMap((t) => t.prompt.moves)
    expect(straight.every((m) => !m.direction.includes('-'))).toBe(true)
    const corner = sample({ size: 8, steps: 6, longest: 3, diagonal: true }).flatMap(
      (t) => t.prompt.moves,
    )
    expect(corner.some((m) => m.direction.includes('-'))).toBe(true)
  })

  it('makes longer steps when it may, and varies the examples', () => {
    const tasks = sample({ size: 7, steps: 5, longest: 3 })
    expect(new Set(tasks.flatMap((t) => t.prompt.moves.map((m) => m.count)))).toEqual(
      new Set([1, 2, 3]),
    )
    expect(new Set(tasks.map((t) => t.itemKey)).size).toBeGreaterThan(SAMPLES * 0.9)
  })
})

describe('dictationPlugin', () => {
  it('dictates the steps aloud and asks where they end', () => {
    const task = dictationPlugin.generateTyped({ size: 5, steps: 3, longest: 1 }, createRandom(2))
    expect(dictationPlugin.speak(task)).toMatch(
      /^Воришка выбежал из отмеченной клетки: (одну клетку (вверх|вниз|влево|вправо)(, )?){3}\. Где он спрятался\?$/,
    )
  })

  it('asks where they began when the end is marked', () => {
    const task = dictationPlugin.generateTyped(
      { size: 7, steps: 5, longest: 3, ask: 'start' },
      createRandom(2),
    )
    expect(dictationPlugin.speak(task)).toMatch(/Откуда он прибежал\?$/)
  })

  it.each([
    { size: 9, steps: 3, longest: 1 },
    { size: 5, steps: 3, longest: 5 },
    { size: 5, steps: 3 },
    { size: 5, steps: 3, longest: 1, ask: 'middle' },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => dictationPlugin.generate(knobs, createRandom(1))).toThrow(/dictation/)
  })
})
