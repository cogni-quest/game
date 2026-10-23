import { describe, expect, it } from 'vitest'

import { numberAnswer } from './answers/number'
import { startAttempts } from './attempts'

describe('startAttempts', () => {
  it('ends on a right first try, without the model', () => {
    const attempts = startAttempts(numberAnswer(13, 20))
    expect(attempts.submit(13)).toEqual({
      verdict: 'correct',
      final: true,
      showExplain: false,
      attempt: 1,
    })
    expect(attempts.done).toBe(true)
  })

  it('gives a second try after a miss', () => {
    const attempts = startAttempts(numberAnswer(13, 20))
    expect(attempts.submit(12)).toEqual({
      verdict: 'wrong',
      final: false,
      showExplain: false,
      attempt: 1,
    })
    expect(attempts.done).toBe(false)
  })

  it('shows the model and names the answer after the last miss', () => {
    const attempts = startAttempts(numberAnswer(13, 20))
    attempts.submit(12)
    expect(attempts.submit(31)).toEqual({
      verdict: 'wrong',
      final: true,
      showExplain: true,
      reveal: 13,
      attempt: 2,
    })
  })

  it('counts a right second try as the second attempt', () => {
    const attempts = startAttempts(numberAnswer(13, 20))
    attempts.submit(12)
    expect(attempts.submit(13).attempt).toBe(2)
  })

  it('refuses answers after the task is finished', () => {
    const attempts = startAttempts(numberAnswer(13, 20))
    attempts.submit(13)
    expect(() => attempts.submit(13)).toThrow()
  })

  it('refuses a policy with no tries', () => {
    expect(() => startAttempts(numberAnswer(1, 5), { maxAttempts: 0 })).toThrow(RangeError)
  })
})
