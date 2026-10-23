import type { Task } from '@cogni/core'

import { anglesPlugin, isAnglesTask, type Angle } from '../logic'

const RAY = 80
const BOX = 2 * RAY + 40
const STROKE = '#3b3428'

/** One angle, or three numbered ones: two rays from a dot. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isAnglesTask(task)) return null
  const { angles, ask } = task.prompt
  const numbered = ask === 'which'
  const height = BOX + (numbered ? 36 : 0)
  const width = BOX * angles.length
  return (
    <figure className="angles-prompt">
      <figcaption>{anglesPlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        height={height}
        role="img"
        aria-label={anglesPlugin.speak(task)}
      >
        {angles.map((angle, i) => (
          <g key={i} transform={`translate(${String(i * BOX + BOX / 2)} ${String(BOX / 2)})`}>
            <Rays angle={angle} />
            {numbered && (
              <text
                y={BOX / 2 + 24}
                textAnchor="middle"
                fontSize={26}
                fontWeight={700}
                fill="#1f4e8c"
              >
                {i + 1}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}

/** Two rays from the origin: one at `turn`, the other `degrees` further round. */
function Rays({ angle }: { readonly angle: Angle }) {
  const end = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: RAY * Math.cos(rad), y: -RAY * Math.sin(rad) }
  }
  const a = end(angle.turn)
  const b = end(angle.turn + angle.degrees)
  return (
    <>
      <line x1={0} y1={0} x2={a.x} y2={a.y} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={b.x} y2={b.y} stroke={STROKE} strokeWidth={4} strokeLinecap="round" />
      <circle r={6} fill={STROKE} />
    </>
  )
}
