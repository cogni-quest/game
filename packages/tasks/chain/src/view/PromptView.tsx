import type { Task } from '@cogni/core'

import { chainPlugin, isChainTask } from '../logic'

/** `20 − (5 + 3) = □`, the empty box in colour. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isChainTask(task)) return null
  return (
    <figure className="chain-prompt">
      {task.prompt.ask === 'brackets' && <figcaption>Где поставить скобки?</figcaption>}
      <p aria-label={chainPlugin.speak(task)}>
        {task.prompt.tokens.map((token, i) =>
          token === 'blank' ? (
            <span key={i} className="chain-blank">
              □
            </span>
          ) : (
            <span key={i}>{token}</span>
          ),
        )}
      </p>
    </figure>
  )
}
