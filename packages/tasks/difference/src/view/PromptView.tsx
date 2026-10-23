import type { Task } from '@cogni/core'

import { differencePlugin, isDifferenceTask } from '../logic'

const DOT = 40

/** Red circles over blue ones, paired column by column; or the question in words. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isDifferenceTask(task)) return null
  const said = differencePlugin.speak(task)
  const { show, red, blue } = task.prompt
  if (show === 'number') return <p className="difference-question">{said}</p>
  const width = Math.max(red, blue) * DOT
  return (
    <figure className="difference-prompt">
      <figcaption>{said}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(2 * DOT)}`}
        width={width}
        height={2 * DOT}
        role="img"
        aria-label={said}
      >
        <Row count={red} y={0} fill="#c94c3c" />
        <Row count={blue} y={DOT} fill="#3f6fb5" />
      </svg>
    </figure>
  )
}

function Row({
  count,
  y,
  fill,
}: {
  readonly count: number
  readonly y: number
  readonly fill: string
}) {
  return Array.from({ length: count }, (_, i) => (
    <circle key={i} cx={i * DOT + DOT / 2} cy={y + DOT / 2} r={DOT / 2 - 4} fill={fill} />
  ))
}
