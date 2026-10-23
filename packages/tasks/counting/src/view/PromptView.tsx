import type { Task } from '@cogni/core'

import { countingPlugin, isCountingTask } from '../logic'

/** One cell of the picture, in SVG units. */
const CELL = 48
const RADIUS = 18

const COLOR = { all: '#e8833a', red: '#d64545', other: '#4a7bd0' } as const

/** Circles to count — in a row, in a ten-frame, or scattered among others. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isCountingTask(task)) return null
  const { prompt } = task
  const width = prompt.columns * CELL
  const height = prompt.rows * CELL
  const fill = (target: boolean) =>
    prompt.ask === 'all' ? COLOR.all : target ? COLOR.red : COLOR.other

  return (
    <figure className="counting-prompt">
      <figcaption>{countingPlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        height={height}
        role="img"
        aria-label={countingPlugin.speak(task)}
      >
        {prompt.layout === 'frame' &&
          Array.from({ length: prompt.columns * prompt.rows }, (_, i) => (
            <rect
              key={`cell-${String(i)}`}
              x={(i % prompt.columns) * CELL}
              y={Math.floor(i / prompt.columns) * CELL}
              width={CELL}
              height={CELL}
              fill="none"
              stroke="#1d1d1f"
              strokeWidth={2}
            />
          ))}
        {prompt.items.map((item) => (
          <circle
            key={`${String(item.x)}-${String(item.y)}`}
            cx={item.x * CELL + CELL / 2}
            cy={item.y * CELL + CELL / 2}
            r={RADIUS}
            fill={fill(item.target)}
          />
        ))}
      </svg>
    </figure>
  )
}
