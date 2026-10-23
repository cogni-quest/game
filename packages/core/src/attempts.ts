import type { AnswerSpec } from './task'

/**
 * How many tries a task gets, and what happens after a miss. This is
 * methodology, so it lives in the core: every game gets the same decision in
 * an `Outcome` and only draws its consequences (ARCHITECTURE.md, «Плагин игры»).
 */
export interface AttemptPolicy {
  readonly maxAttempts: number
}

export const DEFAULT_ATTEMPT_POLICY: AttemptPolicy = { maxAttempts: 2 }

export interface Outcome<A> {
  readonly verdict: 'correct' | 'wrong'
  /** No more tries on this task. */
  readonly final: boolean
  /** Show the model (ten-frame, bar model) before the answer is named. */
  readonly showExplain: boolean
  /** The right answer, once the tries have run out. */
  readonly reveal?: A
  /** 1 for the first try. Only the first try counts towards mastery. */
  readonly attempt: number
}

export interface Attempts<A> {
  submit(given: A): Outcome<A>
  readonly done: boolean
}

export function startAttempts<A>(
  answer: AnswerSpec<A>,
  policy: AttemptPolicy = DEFAULT_ATTEMPT_POLICY,
): Attempts<A> {
  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
    throw new RangeError(`A task needs at least one try: ${String(policy.maxAttempts)}`)
  }

  let attempt = 0
  let done = false

  return {
    get done() {
      return done
    },
    submit(given) {
      if (done) throw new Error('This task is already finished')
      attempt += 1

      if (answer.isCorrect(given)) {
        done = true
        return { verdict: 'correct', final: true, showExplain: false, attempt }
      }

      if (attempt < policy.maxAttempts) {
        return { verdict: 'wrong', final: false, showExplain: false, attempt }
      }

      done = true
      return {
        verdict: 'wrong',
        final: true,
        showExplain: true,
        reveal: answer.expected,
        attempt,
      }
    },
  }
}
