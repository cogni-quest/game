import { describe, expect, it } from 'vitest'

import { cellOrderAnswer, firstMistake, isCellOrderAnswer } from './cellOrder'

const a = { row: 0, column: 0 }
const b = { row: 1, column: 2 }
const c = { row: 2, column: 1 }

describe('cellOrderAnswer', () => {
  it('accepts only the same cells in the same order', () => {
    const answer = cellOrderAnswer([a, b, c], 3, 3)
    expect(isCellOrderAnswer(answer)).toBe(true)
    expect(answer.isCorrect([a, b, c])).toBe(true)
    expect(answer.isCorrect([a, c, b])).toBe(false)
    expect(answer.isCorrect([a, b])).toBe(false)
    expect(answer.isCorrect([a, b, c, a])).toBe(false)
    expect(answer.isCorrect([])).toBe(false)
  })

  it('refuses an order that is empty or leaves the board', () => {
    expect(() => cellOrderAnswer([], 3, 3)).toThrow(/at least one/)
    expect(() => cellOrderAnswer([a, { row: 3, column: 0 }], 3, 3)).toThrow(/off the board/)
    expect(() => cellOrderAnswer([{ row: 0.5, column: 0 }], 3, 3)).toThrow(/off the board/)
  })

  it('refuses a board without whole sides', () => {
    expect(() => cellOrderAnswer([a], 0, 3)).toThrow(RangeError)
    expect(() => cellOrderAnswer([a], 3, 1.5)).toThrow(RangeError)
  })
})

describe('a coloured order', () => {
  const red = { ...a, colour: 'red' }
  const blue = { ...b, colour: 'blue' }

  it('asks the colours too: the right cells in a wrong colour are a miss', () => {
    const answer = cellOrderAnswer([red, blue], 3, 3)
    expect(answer.isCorrect([red, blue])).toBe(true)
    expect(answer.isCorrect([red, { ...b, colour: 'red' }])).toBe(false)
    expect(answer.isCorrect([a, b])).toBe(false)
    expect(firstMistake([red, blue], [red, { ...b, colour: 'red' }])).toBe(1)
  })

  it('refuses an order where only some cells have a colour', () => {
    expect(() => cellOrderAnswer([red, b], 3, 3)).toThrow(/colour/)
  })
})

describe('firstMistake', () => {
  it('finds the first press that parts from the right order', () => {
    expect(firstMistake([a, b, c], [a, b, c])).toBeNull()
    expect(firstMistake([a, b, c], [b, a, c])).toBe(0)
    expect(firstMistake([a, b, c], [a, b, a])).toBe(2)
  })

  it('points past the shorter one when an order stops early or runs on', () => {
    expect(firstMistake([a, b, c], [a, b])).toBe(2)
    expect(firstMistake([a, b], [a, b, c])).toBe(2)
  })
})
