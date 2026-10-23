import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateMaze, type MazePrompt, type Spot } from './generate'
import type { MazeKnobs } from './knobs'
import { mazePlugin } from './plugin'

const SAMPLES = 300

function sample(knobs: MazeKnobs) {
  const random = createRandom(21)
  return Array.from({ length: SAMPLES }, () => generateMaze(knobs, random))
}

/** Walks the drawn maze from a cell, through gaps in the walls only; returns the way to each cell. */
function walk({ size, walls }: MazePrompt, from: Spot): Map<string, Spot[]> {
  const key = (s: Spot) => `${String(s.row)}.${String(s.column)}`
  const wall = (s: Spot) => walls[s.row * size + s.column] ?? { east: true, south: true }
  const ways = new Map([[key(from), [from]]])
  const queue = [from]
  while (queue.length > 0) {
    const s = queue.shift() ?? from
    const here = ways.get(key(s)) ?? []
    const steps: Spot[] = []
    if (!wall(s).east) steps.push({ row: s.row, column: s.column + 1 })
    if (!wall(s).south) steps.push({ row: s.row + 1, column: s.column })
    if (s.column > 0 && !wall({ row: s.row, column: s.column - 1 }).east) {
      steps.push({ row: s.row, column: s.column - 1 })
    }
    if (s.row > 0 && !wall({ row: s.row - 1, column: s.column }).south) {
      steps.push({ row: s.row - 1, column: s.column })
    }
    for (const next of steps) {
      if (!ways.has(key(next))) {
        ways.set(key(next), [...here, next])
        queue.push(next)
      }
    }
  }
  return ways
}

const at = (s: Spot) => `${String(s.row)}.${String(s.column)}`

describe('generateMaze', () => {
  it.each<MazeKnobs>([
    { size: 'small', exits: 3 },
    { size: 'big', exits: 4 },
    { size: 'small', exits: 4 },
  ])('exactly one exit reaches the treasure, and it is the answer: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const ways = walk(prompt, prompt.treasure)
      const reaching = prompt.exits.filter((e) => ways.has(at(e)))
      return reaching.length !== 1 || String(reaching[0]?.number) !== answer.expected
    })
    expect(wrong).toEqual([])
  })

  it.each<MazeKnobs>([
    { size: 'small', exits: 3, key: true },
    { size: 'big', exits: 4, key: true },
  ])('with a key, every exit reaches the treasure, one way past the key: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const { key } = prompt
      if (!key) return true
      const ways = walk(prompt, prompt.treasure)
      const passing = prompt.exits.filter((e) => {
        const path = ways.get(at(e))
        return path?.some((s) => at(s) === at(key)) === true
      })
      return (
        prompt.exits.some((e) => !ways.has(at(e))) ||
        passing.length !== 1 ||
        String(passing[0]?.number) !== answer.expected
      )
    })
    expect(wrong).toEqual([])
  })

  it('puts distinct numbered exits on the border, the treasure inside', () => {
    const wrong = sample({ size: 'big', exits: 4 }).filter(({ prompt }) => {
      const n = prompt.size
      const onBorder = prompt.exits.every(
        (e) =>
          (e.side === 'north' && e.row === 0) ||
          (e.side === 'south' && e.row === n - 1) ||
          (e.side === 'west' && e.column === 0) ||
          (e.side === 'east' && e.column === n - 1),
      )
      const cells = new Set(prompt.exits.map(at))
      const numbers = prompt.exits.map((e) => e.number).join()
      const { row, column } = prompt.treasure
      return (
        !onBorder ||
        cells.size !== 4 ||
        numbers !== '1,2,3,4' ||
        row < 1 ||
        row > n - 2 ||
        column < 1 ||
        column > n - 2
      )
    })
    expect(wrong).toEqual([])
  })

  it('makes every exit the answer sometimes, and offers every exit', () => {
    const tasks = sample({ size: 'small', exits: 3 })
    expect(new Set(tasks.map((t) => t.answer.expected))).toEqual(new Set(['1', '2', '3']))
    expect(tasks.every((t) => t.answer.options.length === 3)).toBe(true)
  })
})

describe('mazePlugin', () => {
  it('asks the question aloud', () => {
    const task = mazePlugin.generateTyped({ size: 'small', exits: 3, key: true }, createRandom(1))
    expect(mazePlugin.speak(task)).toBe(
      'Какой выход ведёт к сокровищу, если по дороге надо взять ключ?',
    )
  })

  it.each([{ size: 'huge', exits: 3 }, { size: 'small', exits: 5 }, { size: 'small' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => mazePlugin.generate(knobs, createRandom(1))).toThrow(/maze/)
    },
  )
})
