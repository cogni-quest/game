import type { Task } from '@cogni/core'

import { isSortTask, sortPlugin, type Colour, type Figure } from '../logic'

const CELL = 72
const SIZE = 26
const FILL: Record<Colour, string> = { red: '#d9433a', blue: '#3f6fb5', green: '#3a9a4a' }

/** The question; for two features also the numbered shapes to choose from. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isSortTask(task)) return null
  const said = sortPlugin.speak(task)
  const { prompt } = task
  return (
    <figure className="sort-prompt">
      <figcaption>{said}</figcaption>
      {prompt.by === 'two-features' && (
        <svg
          viewBox={`0 0 ${String(prompt.figures.length * CELL)} ${String(CELL + 24)}`}
          width={prompt.figures.length * CELL}
          height={CELL + 24}
          role="img"
          aria-label={said}
        >
          {prompt.figures.map((figure, i) => (
            <g key={i} transform={`translate(${String(i * CELL + CELL / 2)} ${String(CELL / 2)})`}>
              <Shape figure={figure} />
              <text y={CELL / 2 + 18} textAnchor="middle" fontSize={18} fontWeight={700}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      )}
    </figure>
  )
}

function Shape({ figure }: { readonly figure: Figure }) {
  const fill = FILL[figure.colour]
  switch (figure.shape) {
    case 'circle':
      return <circle r={SIZE} fill={fill} />
    case 'square':
      return <rect x={-SIZE} y={-SIZE} width={2 * SIZE} height={2 * SIZE} fill={fill} />
    case 'triangle':
      return (
        <polygon
          points={`0,${String(-SIZE)} ${String(SIZE)},${String(SIZE)} ${String(-SIZE)},${String(SIZE)}`}
          fill={fill}
        />
      )
  }
}
