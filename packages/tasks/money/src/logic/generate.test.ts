import { createRandom, isPickAnswer } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateMoney, isNote, type MoneyTask } from './generate'
import type { MoneyKnobs } from './knobs'
import { moneyPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: MoneyKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateMoney(knobs, random))
}

function itemsOf(task: MoneyTask): readonly number[] {
  return task.prompt.ask === 'count' ? task.prompt.items : []
}

describe('generateMoney', () => {
  it.each<MoneyKnobs>([
    { ask: 'count', max: 10 },
    { ask: 'count', max: 100 },
    { ask: 'count', max: 100, notes: true },
  ])('counts two to six coins of two kinds or more, within the total: %j', (knobs) => {
    const max = knobs.ask === 'count' ? knobs.max : 0
    const wrong = sample(knobs).filter((task) => {
      const items = itemsOf(task)
      const total = items.reduce((sum, value) => sum + value, 0)
      return (
        task.answer.expected !== total ||
        total > max ||
        items.length < 2 ||
        items.length > 6 ||
        new Set(items).size < 2
      )
    })
    expect(wrong).toEqual([])
  })

  it('puts a note in only with `notes`', () => {
    const withNotes = sample({ ask: 'count', max: 100, notes: true })
    expect(withNotes.every((t) => itemsOf(t).some(isNote))).toBe(true)
    const coinsOnly = sample({ ask: 'count', max: 100 })
    expect(coinsOnly.some((t) => itemsOf(t).some(isNote))).toBe(false)
  })

  it.each([10, 100] as const)('gives change from %i', (from) => {
    const wrong = sample({ ask: 'change', from }).filter(
      ({ prompt, answer }) =>
        prompt.ask !== 'change' ||
        prompt.price < 1 ||
        prompt.price >= from ||
        answer.expected !== from - prompt.price,
    )
    expect(wrong).toEqual([])
  })
})

describe('make a sum', () => {
  it.each([10, 100] as const)(
    'up to %i: the right coins make the sum, and so do any others',
    (max) => {
      const wrong = sample({ ask: 'make', max }).filter(({ prompt, answer }) => {
        if (prompt.ask !== 'make' || !isPickAnswer(answer)) return true
        const worth = (given: readonly string[]) =>
          given.reduce((sum, v) => sum + (prompt.purse[Number(v.slice(1))] ?? 0), 0)
        const all = answer.options.map((o) => o.value)
        return (
          worth(answer.expected) !== prompt.target ||
          !answer.isCorrect(answer.expected) ||
          answer.isCorrect(all) ||
          prompt.target > max
        )
      })
      expect(wrong).toEqual([])
    },
  )
})

describe('moneyPlugin', () => {
  it('asks the change aloud with the right word endings', () => {
    const task = moneyPlugin.generateTyped({ ask: 'change', from: 10 }, createRandom(1))
    expect(moneyPlugin.speak(task)).toMatch(
      /^Купили за \d (рубль|рубля|рублей), дали 10 рублей\. Сколько сдачи\?$/,
    )
    const one = { ...task, prompt: { ask: 'change', price: 1, from: 10 } } as const
    expect(moneyPlugin.speak(one)).toBe('Купили за 1 рубль, дали 10 рублей. Сколько сдачи?')
  })

  it.each([
    { ask: 'count', max: 5 },
    { ask: 'change', from: 50 },
    { ask: 'count', max: 10, notes: true },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => moneyPlugin.generate(knobs, createRandom(1))).toThrow(/money/)
  })
})
