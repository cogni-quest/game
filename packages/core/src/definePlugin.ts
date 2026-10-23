import type { Random } from './random'
import type { AnswerSpec, ItemWeights, Task, TaskPlugin } from './task'

/**
 * Everything a plugin author writes, with its knob type intact.
 *
 * `parseKnobs` is the plugin's own: it decides how to validate — a schema
 * library, a hand-written check — and the core does not care which.
 */
export interface TaskPluginDefinition<Knobs, Prompt, Answer extends AnswerSpec<unknown>> {
  readonly id: string
  /** Turns knobs from data into typed knobs, or throws. */
  parseKnobs(raw: unknown): Knobs
  generate(knobs: Knobs, random: Random, weights?: ItemWeights): Task<Prompt, Answer>
  speak(task: Task<Prompt, Answer>): string
}

/** A plugin as the core holds it, plus the typed generator for the plugin's own tests. */
export interface DefinedTaskPlugin<
  Knobs,
  Prompt,
  Answer extends AnswerSpec<unknown>,
> extends TaskPlugin<Prompt, Answer> {
  generateTyped(knobs: Knobs, random: Random, weights?: ItemWeights): Task<Prompt, Answer>
}

export function defineTaskPlugin<Knobs, Prompt, Answer extends AnswerSpec<unknown>>(
  definition: TaskPluginDefinition<Knobs, Prompt, Answer>,
): DefinedTaskPlugin<Knobs, Prompt, Answer> {
  return {
    id: definition.id,
    generate(raw, random, weights) {
      let knobs: Knobs
      try {
        knobs = definition.parseKnobs(raw)
      } catch (error) {
        throw new RangeError(`Knobs do not fit plugin '${definition.id}'`, { cause: error })
      }
      return definition.generate(knobs, random, weights)
    },
    generateTyped: (knobs, random, weights) => definition.generate(knobs, random, weights),
    speak: (task) => definition.speak(task),
  }
}
