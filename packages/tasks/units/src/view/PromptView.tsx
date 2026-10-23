import type { Task } from '@cogni/core'

import { isUnitsTask, PAIRS, unitsPlugin, type Pair, type Part } from '../logic'

/** «1 дм 3 см = □ см», written as in the textbook. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isUnitsTask(task)) return null
  const pair = PAIRS[task.prompt.pair]
  return (
    <p className="units-prompt" aria-label={unitsPlugin.speak(task)}>
      <Side parts={task.prompt.left} pair={pair} />
      <span className={task.prompt.sign === '□' ? 'units-blank' : undefined}>
        {task.prompt.sign}
      </span>
      <Side parts={task.prompt.right} pair={pair} />
    </p>
  )
}

function Side({ parts, pair }: { readonly parts: readonly Part[]; readonly pair: Pair }) {
  return parts.map(({ count, unit }, i) => (
    <span key={i}>
      {count === 'blank' ? <span className="units-blank">□</span> : count}{' '}
      <small>{pair[unit].short}</small>
    </span>
  ))
}
