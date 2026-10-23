import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateGroups, type GroupsTask } from './generate'
import type { GroupsKnobs } from './knobs'
import { groupsPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: GroupsKnobs): GroupsTask[] {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateGroups(knobs, random))
}

describe('generateGroups', () => {
  it('sum: equal terms, the answer is their total', () => {
    const wrong = sample({ ask: 'sum', minTerms: 2, maxTerms: 3, maxSize: 5 }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'sum' ||
        prompt.count < 2 ||
        prompt.count > 3 ||
        prompt.size < 2 ||
        prompt.size > 5 ||
        answer.expected !== prompt.size * prompt.count,
    )
    expect(wrong).toEqual([])
  })

  it('product: the answer is how many terms there are', () => {
    const wrong = sample({ ask: 'product', minTerms: 4, maxTerms: 5, maxSize: 9 }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'product' ||
        answer.expected !== prompt.count ||
        prompt.count < 4 ||
        prompt.count > 5,
    )
    expect(wrong).toEqual([])
  })

  it('plates and arrays: the answer is all of them together', () => {
    const plates = sample({ ask: 'plates', maxGroups: 5, maxSize: 4 }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'plates' ||
        answer.expected !== prompt.groups * prompt.size ||
        prompt.groups > 5 ||
        prompt.size > 4,
    )
    const arrays = sample({ ask: 'array', maxRows: 3, maxColumns: 5 }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'array' ||
        answer.expected !== prompt.rows * prompt.columns ||
        prompt.rows > 3 ||
        prompt.columns > 5,
    )
    expect([...plates, ...arrays]).toEqual([])
  })

  it('commutative: names the relation, offers all three words, and is often equal', () => {
    const tasks = sample({ ask: 'commutative', maxFactor: 9 })
    const wrong = tasks.filter(({ prompt, answer }) => {
      if (prompt.ask !== 'commutative' || answer.shape !== 'choice') return true
      const [a, b] = prompt.left
      const [c, d] = prompt.right
      const expected = a * b > c * d ? 'greater' : a * b < c * d ? 'less' : 'equal'
      const factors = [a, b, c, d]
      return (
        answer.expected !== expected ||
        answer.options.length !== 3 ||
        !answer.options.some((o) => o.value === answer.expected) ||
        a === b ||
        factors.some((n) => n < 2 || n > 9)
      )
    })
    expect(wrong).toEqual([])
    expect(new Set(tasks.map((t) => t.answer.expected))).toEqual(
      new Set(['greater', 'less', 'equal']),
    )
  })

  it('commutative: an equal pair is the same two factors swapped', () => {
    const wrong = sample({ ask: 'commutative', maxFactor: 5 }).filter(
      ({ prompt, answer }) =>
        prompt.ask === 'commutative' &&
        answer.expected === 'equal' &&
        (prompt.left[0] !== prompt.right[1] || prompt.left[1] !== prompt.right[0]),
    )
    expect(wrong).toEqual([])
  })

  it.each([10, 20])('share and measure-out divide exactly, up to %i', (max) => {
    const wrong = [...sample({ ask: 'share', max }), ...sample({ ask: 'measure-out', max })].filter(
      ({ prompt, answer }) => {
        if (prompt.ask === 'share') {
          return (
            answer.expected !== prompt.total / prompt.groups ||
            prompt.groups < 2 ||
            prompt.groups > 5 ||
            answer.expected < 2 ||
            prompt.total > max
          )
        }
        if (prompt.ask === 'measure-out') {
          return (
            answer.expected !== prompt.total / prompt.size ||
            prompt.size < 2 ||
            answer.expected < 2 ||
            answer.expected > 5 ||
            prompt.total > max
          )
        }
        return true
      },
    )
    expect(wrong).toEqual([])
  })

  it('keys sharing apart from measuring out', () => {
    const random = createRandom(1)
    const share = generateGroups({ ask: 'share', max: 4 }, random)
    const measure = generateGroups({ ask: 'measure-out', max: 4 }, random)
    expect(share.itemKey).toBe('grp:share:4/2')
    expect(measure.itemKey).toBe('grp:measure-out:4/2')
  })
})

describe('groupsPlugin', () => {
  it('reads the question aloud with the right word endings', () => {
    const plates = groupsPlugin.generateTyped(
      { ask: 'plates', maxGroups: 2, maxSize: 2 },
      createRandom(1),
    )
    expect(groupsPlugin.speak(plates)).toBe(
      '2 тарелки, на каждой по 2 конфеты. Сколько всего конфет?',
    )
    const array = groupsPlugin.generateTyped(
      { ask: 'array', maxRows: 2, maxColumns: 2 },
      createRandom(1),
    )
    expect(groupsPlugin.speak(array)).toBe('2 ряда по 2 кружка. Сколько всего кружков?')
    const sum = groupsPlugin.generateTyped(
      { ask: 'sum', minTerms: 3, maxTerms: 3, maxSize: 2 },
      createRandom(1),
    )
    expect(groupsPlugin.speak(sum)).toBe('Сколько будет 2 плюс 2 плюс 2?')
  })

  it.each([
    { ask: 'sum', minTerms: 4, maxTerms: 3, maxSize: 5 },
    { ask: 'sum', minTerms: 2, maxTerms: 6, maxSize: 5 },
    { ask: 'share', max: 30 },
    { ask: 'divide', max: 10 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => groupsPlugin.generate(knobs, createRandom(1))).toThrow(/groups/)
  })
})
