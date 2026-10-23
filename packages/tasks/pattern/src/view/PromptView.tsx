import type { Task } from '@cogni/core'

import { isPatternTask, patternPlugin } from '../logic'
import { FigureShape } from './FigureIcon'

const CELL = 64
const GAP = 12

/** The row of figures, with a dashed place and a question mark where the answer goes. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isPatternTask(task)) return null
  const { places } = task.prompt
  const width = places.length * (CELL + GAP) - GAP
  const said = patternPlugin.speak(task)
  return (
    <figure className="pattern-prompt">
      <figcaption>{said}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(CELL)}`}
        width={width}
        height={CELL}
        role="img"
        aria-label={said}
      >
        {places.map((place, i) => {
          const x = i * (CELL + GAP)
          return place === 'blank' ? (
            <g key={i}>
              <rect
                x={x + 3}
                y={3}
                width={CELL - 6}
                height={CELL - 6}
                rx={10}
                fill="none"
                stroke="#b5452b"
                strokeWidth={3}
                strokeDasharray="8 6"
              />
              <text
                x={x + CELL / 2}
                y={CELL / 2 + 13}
                textAnchor="middle"
                fontSize={36}
                fontWeight={700}
                fill="#b5452b"
              >
                ?
              </text>
            </g>
          ) : (
            <FigureShape key={i} figure={place} x={x} y={0} size={CELL} />
          )
        })}
      </svg>
    </figure>
  )
}
