import { describe, expect, it } from 'vitest'

import { choiceAnswer } from './choice'
import { isPickAnswer, pickAnswer } from './pick'

const options = [
  { value: 'a', label: '1' },
  { value: 'b', label: '2' },
  { value: 'c', label: '3' },
  { value: 'd', label: '4' },
] as const

describe('pickAnswer', () => {
  it('accepts exactly the right options, in any order', () => {
    const answer = pickAnswer(['a', 'c'], options)
    expect(answer.isCorrect(['c', 'a'])).toBe(true)
    expect(answer.isCorrect(['a'])).toBe(false)
    expect(answer.isCorrect(['a', 'c', 'd'])).toBe(false)
    expect(answer.isCorrect(['a', 'a', 'c'])).toBe(false)
  })

  it('takes the plugin’s own rule where several selections are right', () => {
    const value = { a: 1, b: 2, c: 3, d: 5 } as const
    const sum = (given: readonly (keyof typeof value)[]) =>
      given.reduce((total, v) => total + value[v], 0)
    const answer = pickAnswer(['a', 'b'], options, (given) => sum(given) === 3)
    expect(answer.isCorrect(['c'])).toBe(true)
    expect(answer.isCorrect(['b', 'a'])).toBe(true)
    expect(answer.isCorrect(['d'])).toBe(false)
  })

  it('is told apart from a choice', () => {
    expect(isPickAnswer(pickAnswer(['a'], options))).toBe(true)
    expect(isPickAnswer(choiceAnswer('a', options))).toBe(false)
  })

  it('refuses a right selection that is not among the options, or not accepted', () => {
    expect(() => pickAnswer([], options)).toThrow(RangeError)
    expect(() => pickAnswer(['z' as 'a'], options)).toThrow(RangeError)
    expect(() => pickAnswer(['a'], options, () => false)).toThrow(RangeError)
  })
})
