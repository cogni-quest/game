import type { Task } from '@cogni/core'

import { HEIGHT, isPerimeterTask, perimeterPlugin, WIDTH, type Point } from '../logic'

const STROKE = '#3b3428'
const LABEL_OFFSET = 22
const MARK = 14

/** The figure or the broken line, with the signed sides' lengths next to them. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isPerimeterTask(task)) return null
  const { figure, sides, points, signed } = task.prompt
  const closed = figure !== 'broken-line'
  const centre = {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  }
  const path = points.map((p) => `${String(p.x)},${String(p.y)}`).join(' ')
  return (
    <figure className="perimeter-prompt">
      <figcaption>{perimeterPlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={perimeterPlugin.speak(task)}
      >
        {closed ? (
          <polygon
            points={path}
            fill="#f2e3c2"
            stroke={STROKE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ) : (
          <polyline
            points={path}
            fill="none"
            stroke={STROKE}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill={STROKE} />
        ))}
        {(figure === 'rectangle' || figure === 'square') &&
          points.map((p, i) => <RightMark key={i} at={p} centre={centre} />)}
        {signed.map((i) => {
          const from = points[i]
          const to = points[(i + 1) % points.length]
          if (!from || !to) return null
          const at = labelAt(from, to, closed ? centre : null)
          return (
            <text
              key={i}
              x={at.x}
              y={at.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fontWeight={700}
              fill="#1f4e8c"
            >
              {sides[i]} см
            </text>
          )
        })}
      </svg>
    </figure>
  )
}

/** The middle of a side, pushed away from the figure (or to the left of a line). */
function labelAt(from: Point, to: Point, centre: Point | null): Point {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const length = Math.max(Math.hypot(to.x - from.x, to.y - from.y), 1)
  let normal = { x: (to.y - from.y) / length, y: -(to.x - from.x) / length }
  if (centre && normal.x * (mid.x - centre.x) + normal.y * (mid.y - centre.y) < 0) {
    normal = { x: -normal.x, y: -normal.y }
  }
  const push = centre ? LABEL_OFFSET + 8 : LABEL_OFFSET
  return { x: mid.x + normal.x * push, y: mid.y + normal.y * push }
}

/** The little square in a corner that says the angle is right. */
function RightMark({ at, centre }: { readonly at: Point; readonly centre: Point }) {
  const sx = centre.x > at.x ? MARK : -MARK
  const sy = centre.y > at.y ? MARK : -MARK
  return (
    <path
      d={`M ${String(at.x + sx)} ${String(at.y)} v ${String(sy)} h ${String(-sx)}`}
      fill="none"
      stroke={STROKE}
      strokeWidth={2}
    />
  )
}
