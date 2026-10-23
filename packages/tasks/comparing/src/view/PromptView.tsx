import type { Task } from '@cogni/core'

import { comparingPlugin, isComparingTask } from '../logic'

const DOT = 44

/** «6 □ 7», circles against a number, or two groups of circles against a number. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isComparingTask(task)) return null
  const { left, right, show, groups } = task.prompt
  return (
    <p className="comparing-prompt" aria-label={comparingPlugin.speak(task)}>
      {show === 'number' && <span>{left}</span>}
      {show === 'picture' && <Dots count={left} />}
      {show === 'groups' && groups && (
        <span className="comparing-groups">
          <Dots count={groups[0]} />
          <Dots count={groups[1]} />
        </span>
      )}
      <span className="comparing-box">□</span>
      <span>{right}</span>
    </p>
  )
}

/** A row of circles, five to a group, so the count can be seen as well as counted. */
function Dots({ count }: { readonly count: number }) {
  const gap = 8
  const width = count * DOT + Math.floor((count - 1) / 5) * gap
  return (
    <svg viewBox={`0 0 ${String(width)} ${String(DOT)}`} width={width} height={DOT} role="img">
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={i * DOT + Math.floor(i / 5) * gap + DOT / 2}
          cy={DOT / 2}
          r={DOT / 2 - 3}
          fill="#e8833a"
        />
      ))}
    </svg>
  )
}
