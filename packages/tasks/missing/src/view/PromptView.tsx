import type { Task } from '@cogni/core'

import { isMissingTask, missingPlugin } from '../logic'

/** `□ + 2 = 5`, the empty box in colour. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isMissingTask(task)) return null
  return (
    <p className="missing-prompt" aria-label={missingPlugin.speak(task)}>
      {task.prompt.tokens.map((token, i) =>
        token === 'blank' ? (
          <span key={i} className="missing-blank">
            {task.prompt.letter ? 'x' : '□'}
          </span>
        ) : (
          <span key={i}>{token}</span>
        ),
      )}
    </p>
  )
}
