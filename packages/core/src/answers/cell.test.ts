import { describe, expect, it } from 'vitest'

import { cellAnswer, isCellAnswer } from './cell'

describe('cellAnswer', () => {
  it('accepts only the right cell', () => {
    const answer = cellAnswer({ row: 2, column: 3 }, 5, 5)
    expect(isCellAnswer(answer)).toBe(true)
    expect(answer.isCorrect({ row: 2, column: 3 })).toBe(true)
    expect(answer.isCorrect({ row: 3, column: 2 })).toBe(false)
    expect(answer.isCorrect({ row: 2, column: 4 })).toBe(false)
  })

  it.each([
    { row: -1, column: 0 },
    { row: 0, column: 5 },
    { row: 5, column: 0 },
    { row: 1.5, column: 0 },
  ])('refuses a right cell off the board: %j', (cell) => {
    expect(() => cellAnswer(cell, 5, 5)).toThrow(/off the board/)
  })

  it('refuses a board without whole sides', () => {
    expect(() => cellAnswer({ row: 0, column: 0 }, 0, 5)).toThrow(RangeError)
    expect(() => cellAnswer({ row: 0, column: 0 }, 5, 2.5)).toThrow(RangeError)
  })
})
