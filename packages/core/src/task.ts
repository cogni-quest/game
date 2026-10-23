import type { Random } from './random'

/**
 * How the child's answer is judged. The shape of an answer belongs to the
 * plugin that asks it (ARCHITECTURE.md, «Плагин задачи»): the core knows only
 * that an answer can be checked and has an expected value.
 */
export interface AnswerSpec<A> {
  /** A name for the kind of answer — 'number', 'choice', … — for views and the journal. */
  readonly shape: string
  readonly expected: A
  isCorrect(given: A): boolean
}

/** The value an answer spec checks: `number` for a `NumberAnswer`. */
export type AnswerOf<S> = S extends AnswerSpec<infer A> ? A : never

/**
 * One task, ready to be shown. Generic over the answer *spec*, not just its
 * value, so a plugin's own code keeps the full spec (`NumberAnswer` with its
 * `upTo`) instead of the bare `AnswerSpec<number>`.
 */
export interface Task<Prompt = unknown, Answer extends AnswerSpec<unknown> = AnswerSpec<unknown>> {
  readonly pluginId: string
  /**
   * The concrete example — '6+7', '13-6'. The analytics count mistakes by it
   * and the selector weights it; two tasks with the same key are the same
   * thing to a child.
   */
  readonly itemKey: string
  readonly prompt: Prompt
  readonly answer: Answer
}

/** «Ask these examples more often»: item key → relative weight. */
export type ItemWeights = ReadonlyMap<string, number>

/**
 * A task plugin with its knob type erased, which is how the core holds it.
 *
 * Knobs arrive from data (the curriculum, the parent's screen), so `generate`
 * takes them as `unknown` and validates them itself. A plugin is built with
 * `defineTaskPlugin`, which keeps the typed half for the plugin's own code and
 * tests.
 */
export interface TaskPlugin<
  Prompt = unknown,
  Answer extends AnswerSpec<unknown> = AnswerSpec<unknown>,
> {
  readonly id: string
  /** Throws a RangeError naming the plugin when the knobs do not fit. */
  generate(knobs: unknown, random: Random, weights?: ItemWeights): Task<Prompt, Answer>
  /** What the teacher reads aloud. */
  speak(task: Task<Prompt, Answer>): string
}

/**
 * How a game draws a task it cannot see inside: found by the id of the plugin
 * that made it. Generic over what a render returns, so the core does not
 * depend on React.
 */
export interface TaskView<Rendered> {
  readonly pluginId: string
  renderPrompt(task: Task): Rendered
}
