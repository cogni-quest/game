import type { Task } from '@cogni/core'

import { isSequenceTask, sequencePlugin } from '../logic'

/** «2, 4, 6, □» — the row of numbers, with an empty box where the answer goes. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isSequenceTask(task)) return null
  const { terms } = task.prompt
  return (
    <p className="sequence-prompt" aria-label={sequencePlugin.speak(task)}>
      {terms.map((term, i) => (
        <span key={i}>
          {term === 'blank' ? <span className="sequence-blank">□</span> : term}
          {i < terms.length - 1 && ','}
        </span>
      ))}
    </p>
  )
}
