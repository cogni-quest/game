import type { Task } from '@cogni/core'

import { isRomanTask, romanPlugin } from '../logic'

/** The numeral alone, big, as on a clock face. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isRomanTask(task)) return null
  return (
    <figure className="roman-prompt">
      <figcaption>{romanPlugin.speak(task)}</figcaption>
      <p>{task.prompt.numeral}</p>
    </figure>
  )
}
