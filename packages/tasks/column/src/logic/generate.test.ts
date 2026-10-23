import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateColumn, regroups } from './generate'
import type { ColumnKnobs } from './knobs'
import { columnPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: ColumnKnobs) {
  const random = createRandom(17)
  return Array.from({ length: SAMPLES }, () => generateColumn(knobs, random))
}

/** Place by place, by hand: is any place sum ≥ 10, or any place difference below zero? */
function byHand(op: 'add' | 'sub', a: number, b: number): boolean {
  const da = String(a).split('').reverse().map(Number)
  const db = String(b).split('').reverse().map(Number)
  let carried = 0
  for (let i = 0; i < Math.max(da.length, db.length); i++) {
    const place =
      op === 'add' ? (da[i] ?? 0) + (db[i] ?? 0) + carried : (da[i] ?? 0) - (db[i] ?? 0) - carried
    carried = op === 'add' ? Number(place >= 10) : Number(place < 0)
    if (carried === 1) return true
  }
  return false
}

describe('generateColumn', () => {
  it.each<ColumnKnobs>([
    { op: 'add', carry: false, digits: 2 },
    { op: 'add', carry: true, digits: 2 },
    { op: 'sub', carry: false, digits: 2 },
    { op: 'sub', carry: true, digits: 2 },
    { op: 'add', carry: false, digits: 3 },
    { op: 'add', carry: true, digits: 3 },
    { op: 'sub', carry: false, digits: 3 },
    { op: 'sub', carry: true, digits: 3 },
  ])('the answer is right, the carry as asked, digits as asked: %j', (knobs) => {
    const low = 10 ** (knobs.digits - 1)
    const high = 10 ** knobs.digits - 1
    const wrong = sample(knobs).filter(({ prompt: { op, a, b }, answer }) => {
      const result = op === 'add' ? a + b : a - b
      return (
        answer.expected !== result ||
        result < 1 ||
        result > 999 ||
        byHand(op, a, b) !== knobs.carry ||
        Math.min(a, b) < low ||
        Math.max(a, b) > high
      )
    })
    expect(wrong).toEqual([])
  })

  it.each([
    ['add', 47, 28, true],
    ['add', 45, 23, false],
    ['add', 95, 5, true],
    ['sub', 63, 27, true],
    ['sub', 68, 14, false],
    ['sub', 503, 102, false],
    ['sub', 500, 1, true],
  ] as const)('regroups %s %i %i: %s', (op, a, b, expected) => {
    expect(regroups({ op, a, b })).toBe(expected)
  })
})

describe('columnPlugin', () => {
  it('says the example aloud', () => {
    const task = columnPlugin.generateTyped({ op: 'sub', carry: true, digits: 2 }, createRandom(1))
    expect(columnPlugin.speak(task)).toBe(
      `Вычти в столбик: ${String(task.prompt.a)} минус ${String(task.prompt.b)}.`,
    )
  })

  it.each([
    { op: 'mul', carry: false, digits: 2 },
    { op: 'add', carry: false, digits: 4 },
    { op: 'add', digits: 2 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => columnPlugin.generate(knobs, createRandom(1))).toThrow(/column/)
  })
})
