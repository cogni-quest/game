import { describe, expect, it } from 'vitest'

import { createRandom, pick, randomInt } from './random'

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const first = Array.from({ length: 5 }, a)
    expect(Array.from({ length: 5 }, b)).toEqual(first)
  })

  it('stays inside [0, 1)', () => {
    const values = Array.from({ length: 10_000 }, createRandom(7))
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
  })
})

describe('randomInt', () => {
  it('reaches both ends and nothing outside them', () => {
    const random = createRandom(1)
    const seen = new Set<number>()
    for (let i = 0; i < 2_000; i++) seen.add(randomInt(random, 3, 6))
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })

  it('refuses an empty range', () => {
    expect(() => randomInt(createRandom(1), 5, 4)).toThrow(RangeError)
  })

  it('refuses bounds that are not integers', () => {
    expect(() => randomInt(createRandom(1), 0.5, 4)).toThrow(RangeError)
  })
})

describe('pick', () => {
  it('refuses an empty list', () => {
    expect(() => pick(createRandom(1), [])).toThrow(RangeError)
  })
})
