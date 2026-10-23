import type { AnswerSpec } from '../task'

/** One button of a choice: what it means, and what the child sees and hears. */
export interface ChoiceOption<V extends string> {
  readonly value: V
  readonly label: string
}

/**
 * One of two to four big options, pressed or said aloud — the shared building
 * block for «больше / меньше / равно», «which exit», «odd one out».
 */
export interface ChoiceAnswer<V extends string = string> extends AnswerSpec<V> {
  readonly shape: 'choice'
  readonly options: readonly ChoiceOption<V>[]
}

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 4

export function isChoiceAnswer(answer: AnswerSpec<unknown>): answer is ChoiceAnswer {
  return answer.shape === 'choice'
}

export function choiceAnswer<V extends string>(
  expected: V,
  options: readonly ChoiceOption<V>[],
): ChoiceAnswer<V> {
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new RangeError(
      `A choice has ${String(MIN_OPTIONS)} to ${String(MAX_OPTIONS)} options, not ${String(options.length)}`,
    )
  }
  if (new Set(options.map((o) => o.value)).size !== options.length) {
    throw new RangeError('Two options of a choice share a value')
  }
  if (!options.some((o) => o.value === expected)) {
    throw new RangeError(`The right answer «${expected}» is not among the options`)
  }
  return {
    shape: 'choice',
    expected,
    options,
    isCorrect: (given) => given === expected,
  }
}
