import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateComparing } from './generate'
import type { ComparingKnobs } from './knobs'
import { comparingPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: ComparingKnobs) {
  const random = createRandom(5)
  return Array.from({ length: SAMPLES }, () => generateComparing(knobs, random))
}

describe('generateComparing', () => {
  it('names the relation of the left side to the right', () => {
    const wrong = sample({ max: 10, distance: 'any' }).filter(({ prompt, answer }) => {
      const expected =
        prompt.left > prompt.right ? 'greater' : prompt.left < prompt.right ? 'less' : 'equal'
      return answer.expected !== expected
    })
    expect(wrong).toEqual([])
  })

  it.each([
    ['far', (gap: number) => gap >= 4],
    ['near', (gap: number) => gap === 1],
    ['equal', (gap: number) => gap === 0],
  ] as const)('keeps %s pairs at their distance, within the range', (distance, fits) => {
    const wrong = sample({ max: 10, distance }).filter(
      ({ prompt }) =>
        !fits(Math.abs(prompt.left - prompt.right)) ||
        Math.min(prompt.left, prompt.right) < 1 ||
        Math.max(prompt.left, prompt.right) > 10,
    )
    expect(wrong).toEqual([])
  })

  it('gives both orders, so «the first is bigger» is not a rule', () => {
    const relations = new Set(sample({ max: 10, distance: 'far' }).map((t) => t.answer.expected))
    expect(relations).toEqual(new Set(['greater', 'less']))
  })

  it('keeps teens within 11…20', () => {
    const wrong = sample({ min: 11, max: 20, distance: 'any' }).filter(
      ({ prompt }) =>
        Math.min(prompt.left, prompt.right) < 11 || Math.max(prompt.left, prompt.right) > 20,
    )
    expect(wrong).toEqual([])
  })

  it.each([
    ['other-lead', 10, 99, (a: number, b: number) => Math.floor(a / 10) !== Math.floor(b / 10)],
    [
      'same-lead',
      10,
      99,
      (a: number, b: number) => Math.floor(a / 10) === Math.floor(b / 10) && a !== b,
    ],
    [
      'trap',
      10,
      99,
      (a: number, b: number) => {
        const [small, big] = a < b ? [a, b] : [b, a]
        return Math.floor(big / 10) - Math.floor(small / 10) === 1 && small % 10 > big % 10
      },
    ],
    [
      'same-lead',
      100,
      999,
      (a: number, b: number) => Math.floor(a / 100) === Math.floor(b / 100) && a !== b,
    ],
  ] as const)('%s from %i to %i', (distance, min, max, fits) => {
    const wrong = sample({ min, max, distance }).filter(
      ({ prompt: { left, right } }) =>
        !fits(left, right) || Math.min(left, right) < min || Math.max(left, right) > max,
    )
    expect(wrong).toEqual([])
  })

  it('offers all three words every time', () => {
    const task = generateComparing({ max: 10, distance: 'near' }, createRandom(1))
    expect(task.answer.options.map((o) => o.value)).toEqual(['greater', 'less', 'equal'])
  })

  it('keys a picture apart from the same numbers written', () => {
    const drawn = generateComparing({ max: 10, distance: 'equal', picture: true }, createRandom(1))
    expect(drawn.itemKey).toMatch(/^p\d+\?\d+$/)
    expect(drawn.prompt.show).toBe('picture')
  })

  it('★ two groups: the left side is their sum, within two of the right', () => {
    const wrong = sample({ max: 10, distance: 'any', groups: true }).filter(({ prompt }) => {
      const [a, b] = prompt.groups ?? [0, 0]
      return (
        prompt.show !== 'groups' ||
        a < 1 ||
        b < 1 ||
        a + b !== prompt.left ||
        prompt.left > 10 ||
        Math.abs(prompt.left - prompt.right) > 2
      )
    })
    expect(wrong).toEqual([])
  })
})

describe('comparingPlugin', () => {
  it.each([
    { max: 4, distance: 'far' },
    { max: 10, distance: 'close' },
    { max: 10 },
    { max: 10, distance: 'any', picture: true, groups: true },
    { max: 20, distance: 'any', picture: true },
    { min: 18, max: 20, distance: 'any' },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => comparingPlugin.generate(knobs, createRandom(1))).toThrow(/comparing/)
  })
})
