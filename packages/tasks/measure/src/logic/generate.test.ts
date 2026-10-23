import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateMeasure, type MeasurePrompt } from './generate'
import type { MeasureKnobs } from './knobs'
import { measurePlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: MeasureKnobs) {
  const random = createRandom(9)
  return Array.from({ length: SAMPLES }, () => generateMeasure(knobs, random))
}

/** The prompt of the quantity asked for; anything else fails the test outright. */
function as<Q extends MeasurePrompt['quantity']>(quantity: Q, prompt: MeasurePrompt) {
  if (prompt.quantity !== quantity) throw new Error(`expected ${quantity}, got ${prompt.quantity}`)
  return prompt as Extract<MeasurePrompt, { quantity: Q }>
}

function scales(knobs: MeasureKnobs) {
  return sample(knobs).map((task) => ({ prompt: as('mass', task.prompt), task }))
}

function shelves(knobs: MeasureKnobs) {
  return sample(knobs).map((task) => ({ prompt: as('volume', task.prompt), task }))
}

const sum = (pieces: readonly number[]) => pieces.reduce((a, b) => a + b, 0)

describe('generateMeasure, mass', () => {
  it.each<MeasureKnobs>([
    { quantity: 'mass', weights: 'ones' },
    { quantity: 'mass', weights: 'mixed' },
    { quantity: 'mass', weights: 'ones', balance: true },
    { quantity: 'mass', weights: 'mixed', balance: true },
  ])('balances: the thing and the left weights weigh what the right ones do: %j', (knobs) => {
    const wrong = scales(knobs).filter(
      ({ prompt, task }) =>
        task.answer.expected + sum(prompt.left) !== sum(prompt.right) ||
        task.answer.expected < 2 ||
        sum(prompt.right) > 10,
    )
    expect(wrong).toEqual([])
  })

  it('uses only 1 kg weights for `ones`, and reaches from 2 to 10', () => {
    const tasks = scales({ quantity: 'mass', weights: 'ones' })
    expect(tasks.every(({ prompt }) => prompt.right.every((w) => w === 1))).toBe(true)
    const masses = tasks.map(({ task }) => task.answer.expected)
    expect([Math.min(...masses), Math.max(...masses)]).toEqual([2, 10])
  })

  it('mixes at least two kinds of weight for `mixed`, from 1, 2 and 5 kg', () => {
    const wrong = scales({ quantity: 'mass', weights: 'mixed' }).filter(
      ({ prompt }) =>
        new Set(prompt.right).size < 2 || prompt.right.some((w) => ![1, 2, 5].includes(w)),
    )
    expect(wrong).toEqual([])
  })

  it('puts weights on the left pan only with `balance`', () => {
    expect(
      scales({ quantity: 'mass', weights: 'mixed' }).every((t) => t.prompt.left.length === 0),
    ).toBe(true)
    const balanced = scales({ quantity: 'mass', weights: 'mixed', balance: true })
    expect(balanced.every(({ prompt }) => prompt.left.length >= 1 && prompt.left.length <= 2)).toBe(
      true,
    )
  })
})

describe('generateMeasure, volume', () => {
  it.each<MeasureKnobs>([
    { quantity: 'volume', jars: 'same' },
    { quantity: 'volume', jars: 'mixed' },
  ])('the answer is all the jars together, 2 to 10 litres: %j', (knobs) => {
    const wrong = shelves(knobs).filter(
      ({ prompt, task }) =>
        task.answer.expected !== sum(prompt.jars) ||
        task.answer.expected < 2 ||
        task.answer.expected > 10,
    )
    expect(wrong).toEqual([])
  })

  it('fills only 1 л jars for `same`, and two kinds or more for `mixed`', () => {
    expect(
      shelves({ quantity: 'volume', jars: 'same' }).every(({ prompt }) =>
        prompt.jars.every((j) => j === 1),
      ),
    ).toBe(true)
    expect(
      shelves({ quantity: 'volume', jars: 'mixed' }).every(
        ({ prompt }) => new Set(prompt.jars).size >= 2,
      ),
    ).toBe(true)
  })
})

describe('measurePlugin', () => {
  it('asks the question aloud', () => {
    const task = measurePlugin.generateTyped({ quantity: 'volume', jars: 'same' }, createRandom(1))
    expect(measurePlugin.speak(task)).toBe('Сколько литров воды налили?')
    const mass = measurePlugin.generateTyped({ quantity: 'mass', weights: 'ones' }, createRandom(1))
    expect(measurePlugin.speak(mass)).toMatch(/^Сколько килограммов весит [а-я]+\?$/)
  })

  it.each([
    { quantity: 'mass', weights: 'heavy' },
    { quantity: 'volume', jars: 'same', balance: true },
    { quantity: 'length' },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => measurePlugin.generate(knobs, createRandom(1))).toThrow(/measure/)
  })
})
