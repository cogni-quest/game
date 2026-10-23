import type { Task } from '@cogni/core'

import { isWordTask, type ScenePart, type SceneRow } from '../logic'

const DOT = 30
const GAP = 6
const LABEL = 90
const ROW = DOT + 14

const FILL: Record<ScenePart['mark'], string> = {
  plain: '#e8833a',
  added: '#3a7d44',
  removed: '#c9c2b3',
}

/** The story as text, and as rows of counters when it is told as a picture. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isWordTask(task)) return null
  const { scene, text, ask } = task.prompt
  return (
    <figure className="word-prompt">
      {scene !== undefined && <Scene rows={scene} />}
      <p>{text}</p>
      {ask === 'plan' && <figcaption>Как решить эту задачу?</figcaption>}
    </figure>
  )
}

/** Counters in rows, one row per child: added ones green, taken ones crossed out. */
function Scene({ rows }: { readonly rows: readonly SceneRow[] }) {
  const laid = rows.map((row) => {
    let x = LABEL
    const items = row.parts.flatMap((part, p) => {
      const count = part.count === 'unknown' ? 1 : part.count
      const placed = Array.from({ length: count }, (_, i) => ({
        key: `${String(p)}-${String(i)}`,
        x: x + i * (DOT + GAP),
        part,
      }))
      x += count * (DOT + GAP) + GAP * 2
      return placed
    })
    return { label: row.label, items, width: x }
  })
  const width = Math.max(...laid.map((r) => r.width))
  const height = rows.length * ROW
  return (
    <svg
      className="word-scene"
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
    >
      {laid.map((row, r) => {
        const y = r * ROW + ROW / 2
        return (
          <g key={r}>
            <text x={0} y={y + 6} fontSize={18} fill="#3b3428">
              {row.label}
            </text>
            {row.items.map(({ key, x, part }) =>
              part.count === 'unknown' ? (
                <g key={key}>
                  <rect
                    x={x}
                    y={y - DOT / 2}
                    width={DOT}
                    height={DOT}
                    rx={4}
                    fill="none"
                    stroke="#b5452b"
                    strokeWidth={3}
                  />
                  <text x={x + DOT / 2} y={y + 7} textAnchor="middle" fontSize={20} fill="#b5452b">
                    ?
                  </text>
                </g>
              ) : (
                <g key={key}>
                  <circle cx={x + DOT / 2} cy={y} r={DOT / 2} fill={FILL[part.mark]} />
                  {part.mark === 'removed' && (
                    <path
                      d={`M ${String(x + 4)} ${String(y - 11)} L ${String(x + DOT - 4)} ${String(y + 11)}`}
                      stroke="#b5452b"
                      strokeWidth={4}
                    />
                  )}
                </g>
              ),
            )}
          </g>
        )
      })}
    </svg>
  )
}
