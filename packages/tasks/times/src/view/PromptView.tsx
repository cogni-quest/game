import type { Task } from '@cogni/core'

import { isTimesTask, timesPlugin } from '../logic'

/** `7 × 3 = □`, or a skip-counting row `2, 4, 6, □`; the empty box in colour. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isTimesTask(task)) return null
  return (
    <p className="times-prompt" aria-label={timesPlugin.speak(task)}>
      {task.prompt.tokens.map((token, i) =>
        token === 'blank' ? (
          <span key={i} className="times-blank">
            □
          </span>
        ) : (
          <span key={i}>{token}</span>
        ),
      )}
    </p>
  )
}
