import type { Task } from '@cogni/core'

import { expressionsPlugin, isExpressionsTask, type Side } from '../logic'

/** `7 □ 3 + 5`, as in the textbook. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isExpressionsTask(task)) return null
  return (
    <p className="expressions-prompt" aria-label={expressionsPlugin.speak(task)}>
      <Written side={task.prompt.left} />
      <span className="expressions-box">□</span>
      <Written side={task.prompt.right} />
    </p>
  )
}

function Written({ side }: { readonly side: Side }) {
  return <span>{side.join(' ')}</span>
}
