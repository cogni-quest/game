import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateCounting } from './generate'
import type { CountingKnobs } from './knobs'
import { countingPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: CountingKnobs) {
  const random = createRandom(3)
  return Array.from({ length: SAMPLES }, () => generateCounting(knobs, random))
}

const targets = (items: readonly { target: boolean }[]) => items.filter((i) => i.target).length

describe('generateCounting', () => {
  it.each<CountingKnobs>([
    { min: 1, max: 5, layout: 'row' },
    { min: 1, max: 5, layout: 'scattered' },
    { min: 6, max: 10, layout: 'frame' },
    { min: 6, max: 10, layout: 'scattered' },
    { min: 6, max: 10, layout: 'scattered', distractors: true },
  ])('%j: the answer is the number of targets, within the range', (knobs) => {
    const wrong = sample(knobs).filter(
      (t) =>
        t.answer.expected !== targets(t.prompt.items) ||
        t.answer.expected < knobs.min ||
        t.answer.expected > knobs.max,
    )
    expect(wrong).toEqual([])
  })

  it('never puts two objects in one cell', () => {
    const overlapping = sample({ min: 6, max: 10, layout: 'scattered', distractors: true }).filter(
      (t) =>
        new Set(t.prompt.items.map((i) => `${String(i.x)},${String(i.y)}`)).size !==
        t.prompt.items.length,
    )
    expect(overlapping).toEqual([])
  })

  it('keeps every object inside the field', () => {
    const outside = sample({ min: 6, max: 10, layout: 'scattered', distractors: true }).filter(
      (t) =>
        t.prompt.items.some(
          (i) => i.x < 0 || i.y < 0 || i.x >= t.prompt.columns || i.y >= t.prompt.rows,
        ),
    )
    expect(outside).toEqual([])
  })

  it('fills a ten-frame from the top left', () => {
    const task = generateCounting({ min: 7, max: 7, layout: 'frame' }, createRandom(1))
    expect(task.prompt.items.map((i) => [i.x, i.y])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [0, 1],
      [1, 1],
    ])
  })

  it('asks for the red ones only when there are others mixed in', () => {
    for (const t of sample({ min: 6, max: 10, layout: 'scattered', distractors: true })) {
      expect(t.prompt.ask).toBe('red')
      expect(t.prompt.items.length).toBeGreaterThan(t.answer.expected)
    }
    expect(
      sample({ min: 1, max: 5, layout: 'scattered' }).every((t) => t.prompt.ask === 'all'),
    ).toBe(true)
  })
})

describe('countingPlugin', () => {
  it.each([
    { min: 6, max: 5, layout: 'row' },
    { min: 1, max: 11, layout: 'row' },
    { min: 1, max: 5, layout: 'row', distractors: true },
    { min: 1, max: 5, layout: 'circle' },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => countingPlugin.generate(knobs, createRandom(1))).toThrow(/counting/)
  })

  it('asks the question aloud', () => {
    const task = countingPlugin.generateTyped(
      { min: 6, max: 10, layout: 'scattered', distractors: true },
      createRandom(1),
    )
    expect(countingPlugin.speak(task)).toBe('Сколько красных кружков?')
  })
})
