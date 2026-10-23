import { describe, expect, it } from 'vitest'

import { numberAnswer } from './number'

describe('numberAnswer', () => {
  it('accepts exactly the expected number', () => {
    const answer = numberAnswer(13, 20)
    expect(answer.isCorrect(13)).toBe(true)
    expect(answer.isCorrect(30)).toBe(false)
  })

  it('refuses a range that does not reach the answer', () => {
    expect(() => numberAnswer(25, 20)).toThrow(RangeError)
  })

  it('refuses negative and fractional answers', () => {
    expect(() => numberAnswer(-1, 20)).toThrow(RangeError)
    expect(() => numberAnswer(1.5, 20)).toThrow(RangeError)
  })
})
