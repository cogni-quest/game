import type { Task } from '@cogni/core'

import { isLengthCompareTask, lengthComparePlugin, LONGEST, MAX_SHIFT, type Strip } from '../logic'

const CM = 28
const HEIGHT = 28
const GAP = 20

/** Two strips on the same scale, red on top and blue below. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isLengthCompareTask(task)) return null
  const { red, blue } = task.prompt
  const width = (LONGEST + MAX_SHIFT) * CM
  const height = 2 * HEIGHT + GAP
  return (
    <figure className="length-compare-prompt">
      <figcaption>{lengthComparePlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        height={height}
        role="img"
        aria-label={lengthComparePlugin.speak(task)}
      >
        <Bar strip={red} y={0} fill="#c94c3c" />
        <Bar strip={blue} y={HEIGHT + GAP} fill="#3f6fb5" />
      </svg>
    </figure>
  )
}

function Bar({
  strip,
  y,
  fill,
}: {
  readonly strip: Strip
  readonly y: number
  readonly fill: string
}) {
  return (
    <rect x={strip.start * CM} y={y} width={strip.length * CM} height={HEIGHT} rx={4} fill={fill} />
  )
}
