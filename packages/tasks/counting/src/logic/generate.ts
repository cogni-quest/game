import { numberAnswer, randomInt, type NumberAnswer, type Random, type Task } from '@cogni/core'

import type { CountingKnobs, Layout } from './knobs'

/** One object in the picture, on a grid of cells; only targets are counted. */
export interface Item {
  readonly x: number
  readonly y: number
  readonly target: boolean
}

export interface CountingPrompt {
  readonly layout: Layout
  /** Count everything, or only the red ones among the rest. */
  readonly ask: 'all' | 'red'
  readonly columns: number
  readonly rows: number
  readonly items: readonly Item[]
}

export type CountingTask = Task<CountingPrompt, NumberAnswer>

export const PLUGIN_ID = 'counting'

export function isCountingTask(task: Task): task is CountingTask {
  return task.pluginId === PLUGIN_ID
}

/** The answers stop at ten, and so does the voice grammar — never at five. */
const UP_TO = 10

/** The field scattered objects are placed on: big enough for ten and a few extra. */
const FIELD_COLUMNS = 5
const FIELD_ROWS = 4

export function generateCounting(knobs: CountingKnobs, random: Random): CountingTask {
  const count = randomInt(random, knobs.min, knobs.max)
  const prompt = layOut(knobs, count, random)
  const extras = prompt.items.length - count
  return {
    pluginId: PLUGIN_ID,
    itemKey: `${knobs.layout}${extras > 0 ? '+' : ''}:${String(count)}`,
    prompt,
    answer: numberAnswer(count, UP_TO),
  }
}

function layOut(knobs: CountingKnobs, count: number, random: Random): CountingPrompt {
  switch (knobs.layout) {
    case 'row':
      return {
        layout: 'row',
        ask: 'all',
        columns: count,
        rows: 1,
        items: Array.from({ length: count }, (_, x) => ({ x, y: 0, target: true })),
      }
    case 'frame':
      // A ten-frame: two rows of five, filled from the top left.
      return {
        layout: 'frame',
        ask: 'all',
        columns: 5,
        rows: 2,
        items: Array.from({ length: count }, (_, i) => ({
          x: i % 5,
          y: Math.floor(i / 5),
          target: true,
        })),
      }
    case 'scattered': {
      const extras = knobs.distractors === true ? randomInt(random, 2, 4) : 0
      const cells = shuffledCells(random).slice(0, count + extras)
      return {
        layout: 'scattered',
        ask: extras > 0 ? 'red' : 'all',
        columns: FIELD_COLUMNS,
        rows: FIELD_ROWS,
        items: cells.map((cell, i) => ({ ...cell, target: i < count })),
      }
    }
  }
}

/** Every cell of the field once, in random order — so no two objects overlap. */
function shuffledCells(random: Random): { x: number; y: number }[] {
  const cells = Array.from({ length: FIELD_COLUMNS * FIELD_ROWS }, (_, i) => ({
    x: i % FIELD_COLUMNS,
    y: Math.floor(i / FIELD_COLUMNS),
  }))
  for (let i = cells.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = cells[i]
    const b = cells[j]
    if (a && b) {
      cells[i] = b
      cells[j] = a
    }
  }
  return cells
}
