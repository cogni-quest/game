import type { Task } from '@cogni/core'

import { factsPlugin, isFactsTask } from '../logic'

/** The facts, one per line, then the question; the game also reads it aloud. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isFactsTask(task)) return null
  const lines = task.prompt.text.split(/(?<=[.?]) /)
  return (
    <figure className="facts-prompt" aria-label={factsPlugin.speak(task)}>
      {lines.map((line, i) => (
        <p key={i} className={i === lines.length - 1 ? 'facts-question' : undefined}>
          {line}
        </p>
      ))}
    </figure>
  )
}
