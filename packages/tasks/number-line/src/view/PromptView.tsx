import type { Task } from '@cogni/core'

import { isNumberLineTask, numberLinePlugin } from '../logic'

const STEP = 32
const MARGIN = 20
const LINE = 56

/** A line with a mark at every number, some signed, and an arrow over one mark. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isNumberLineTask(task)) return null
  const { min, max, step, signed, arrow } = task.prompt
  const x = (n: number) => MARGIN + ((n - min) / step) * STEP
  const width = x(max) + MARGIN
  return (
    <figure className="number-line-prompt">
      <figcaption>{numberLinePlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} 96`}
        width={width}
        height={96}
        role="img"
        aria-label={numberLinePlugin.speak(task)}
      >
        <path
          d={`M ${String(x(arrow))} 14 v 30 m -8 -10 l 8 10 l 8 -10`}
          stroke="#b5452b"
          strokeWidth={3}
          fill="none"
        />
        <line
          x1={MARGIN / 2}
          x2={width - MARGIN / 2}
          y1={LINE}
          y2={LINE}
          stroke="#333"
          strokeWidth={2}
        />
        {Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step).map((n) => (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={LINE - 8} y2={LINE + 8} stroke="#333" strokeWidth={2} />
            {signed.includes(n) && (
              <text x={x(n)} y={LINE + 28} textAnchor="middle" fontSize={16} fill="#333">
                {n}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}
