import type { AnswerSpec } from '../task'
import type { ChoiceOption } from './choice'

/**
 * Several of up to twelve options, pressed one by one and then confirmed —
 * the shared building block for «найди все треугольники», «выбери все
 * фрукты» and «набери 8 рублей монетами».
 *
 * `expected` is one right selection, the one shown when the child is told the
 * answer. Usually it is the only one; where several selections are right —
 * any coins that add up to the sum — the plugin passes its own `accepts`.
 */
export interface PickAnswer<V extends string = string> extends AnswerSpec<readonly V[]> {
  readonly shape: 'pick'
  readonly options: readonly ChoiceOption<V>[]
}

export const MAX_PICK_OPTIONS = 12

export function isPickAnswer(answer: AnswerSpec<unknown>): answer is PickAnswer {
  return answer.shape === 'pick'
}

export function pickAnswer<V extends string>(
  expected: readonly V[],
  options: readonly ChoiceOption<V>[],
  accepts?: (given: readonly V[]) => boolean,
): PickAnswer<V> {
  if (options.length < 2 || options.length > MAX_PICK_OPTIONS) {
    throw new RangeError(
      `A pick has 2 to ${String(MAX_PICK_OPTIONS)} options, not ${String(options.length)}`,
    )
  }
  const values = new Set(options.map((o) => o.value))
  if (values.size !== options.length) throw new RangeError('Two options of a pick share a value')
  if (expected.length === 0 || expected.some((v) => !values.has(v))) {
    throw new RangeError('The right selection must be some of the options')
  }
  if (new Set(expected).size !== expected.length) {
    throw new RangeError('The right selection names an option twice')
  }
  const same = (given: readonly V[]) => {
    const chosen = new Set(given)
    return (
      chosen.size === given.length &&
      chosen.size === expected.length &&
      expected.every((v) => chosen.has(v))
    )
  }
  if (accepts !== undefined && !accepts(expected)) {
    throw new RangeError('The right selection is not accepted by the plugin’s own rule')
  }
  return {
    shape: 'pick',
    expected,
    options,
    isCorrect: (given) => new Set(given).size === given.length && (accepts ?? same)(given),
  }
}
