import { describe, expect, it } from 'vitest'

import { numberWords } from './numberWords'

describe('numberWords', () => {
  it.each([
    [0, 'ноль'],
    [7, 'семь'],
    [10, 'десять'],
    [13, 'тринадцать'],
    [20, 'двадцать'],
    [41, 'сорок один'],
    [100, 'сто'],
    [205, 'двести пять'],
    [347, 'триста сорок семь'],
    [612, 'шестьсот двенадцать'],
    [990, 'девятьсот девяносто'],
    [1000, 'тысяча'],
  ])('%i — %s', (n, words) => {
    expect(numberWords(n)).toBe(words)
  })

  it('refuses what it cannot say', () => {
    expect(() => numberWords(-1)).toThrow(RangeError)
    expect(() => numberWords(1001)).toThrow(RangeError)
    expect(() => numberWords(2.5)).toThrow(RangeError)
  })
})
