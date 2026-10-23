import type { AnswerSpec } from '../task'

/**
 * A whole number, typed on the pad or said aloud — the shared building block
 * every arithmetic plugin answers with.
 */
export interface NumberAnswer extends AnswerSpec<number> {
  readonly shape: 'number'
  /**
   * The highest number the child might plausibly give here, right or wrong.
   * The voice grammar will span zero to this, and the pad will not take more
   * digits than it has. Zero is always the bottom, so there is no lower bound
   * to get wrong.
   */
  readonly upTo: number
}

export function isNumberAnswer(answer: AnswerSpec<unknown>): answer is NumberAnswer {
  return answer.shape === 'number'
}

export function numberAnswer(expected: number, upTo: number): NumberAnswer {
  if (!Number.isInteger(expected) || expected < 0) {
    throw new RangeError(`An answer must be a whole number from zero up: ${String(expected)}`)
  }
  if (!Number.isInteger(upTo) || upTo < expected) {
    throw new RangeError(
      `The answer range must reach the answer: ${String(expected)} is above ${String(upTo)}`,
    )
  }
  return {
    shape: 'number',
    expected,
    upTo,
    isCorrect: (given) => given === expected,
  }
}
