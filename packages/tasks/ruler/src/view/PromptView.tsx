import type { Task } from '@cogni/core'

import { isRulerTask, rulerPlugin } from '../logic'

const CM = 32
const MARGIN = 16
const STRIP = 24
const RULER = 48

/** A strip lying just above a ruler with a mark and a number at every centimetre. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isRulerTask(task)) return null
  const { ruler, start, length } = task.prompt
  const width = ruler * CM + 2 * MARGIN
  const height = STRIP + RULER + 4
  const top = STRIP + 4
  return (
    <figure className="ruler-prompt">
      <figcaption>{rulerPlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        height={height}
        role="img"
        aria-label={rulerPlugin.speak(task)}
      >
        <rect
          x={MARGIN + start * CM}
          y={0}
          width={length * CM}
          height={STRIP}
          rx={3}
          fill="#3a7d44"
        />
        <rect x={0} y={top} width={width} height={RULER} rx={4} fill="#f2d98d" />
        {Array.from({ length: 2 * ruler + 1 }, (_, half) => {
          const x = MARGIN + (half * CM) / 2
          const whole = half % 2 === 0
          return (
            <g key={half}>
              <line
                x1={x}
                x2={x}
                y1={top}
                y2={top + (whole ? 16 : 9)}
                stroke="#5a4a2a"
                strokeWidth={whole ? 2 : 1}
              />
              {whole && (
                <text x={x} y={top + 36} textAnchor="middle" fontSize={15} fill="#5a4a2a">
                  {half / 2}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
