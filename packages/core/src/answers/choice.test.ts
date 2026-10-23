import { describe, expect, it } from 'vitest'

import { choiceAnswer, isChoiceAnswer } from './choice'
import { numberAnswer } from './number'

const options = [
  { value: 'more', label: 'больше' },
  { value: 'less', label: 'меньше' },
  { value: 'equal', label: 'равно' },
] as const

describe('choiceAnswer', () => {
  it('accepts exactly the expected option', () => {
    const answer = choiceAnswer('less', options)
    expect(answer.isCorrect('less')).toBe(true)
    expect(answer.isCorrect('more')).toBe(false)
  })

  it('is told apart from a number answer', () => {
    expect(isChoiceAnswer(choiceAnswer('less', options))).toBe(true)
    expect(isChoiceAnswer(numberAnswer(3, 10))).toBe(false)
  })

  it('refuses a right answer that is not an option', () => {
    expect(() =>
      choiceAnswer('none', [
        { value: 'a', label: 'a' },
        { value: 'b', label: 'b' },
      ]),
    ).toThrow(RangeError)
  })

  it('refuses too few, too many and repeated options', () => {
    expect(() => choiceAnswer('a', [{ value: 'a', label: 'a' }])).toThrow(RangeError)
    const five = ['a', 'b', 'c', 'd', 'e'].map((v) => ({ value: v, label: v }))
    expect(() => choiceAnswer('a', five)).toThrow(RangeError)
    expect(() =>
      choiceAnswer('a', [
        { value: 'a', label: 'a' },
        { value: 'a', label: 'b' },
      ]),
    ).toThrow(RangeError)
  })
})
