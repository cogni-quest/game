import type { Task } from '@cogni/core'

import { HEIGHT, isShapesTask, shapesPlugin, WIDTH, type Geometry, type Point } from '../logic'

const STROKE = '#3b3428'
const DOT = 6
/** Soft fills, handed out in turn, so a colour never tells which shape it is. */
const FILLS = ['#f2c48d', '#a8cfe0', '#c5dca0', '#e8b4c8', '#d9c6ef', '#f5e19a']

/** One shape to name, or a field of shapes to count. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isShapesTask(task)) return null
  const { prompt } = task
  const figures = prompt.ask === 'name' ? [prompt.figure] : prompt.figures
  return (
    <figure className="shapes-prompt">
      <figcaption>{shapesPlugin.speak(task)}</figcaption>
      <svg
        viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label={shapesPlugin.speak(task)}
        style={{ overflow: 'hidden' }}
      >
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#fffdf7" stroke="#e2dccb" />
        {figures.map((figure, i) => (
          <Shape key={i} geometry={figure.geometry} fill={FILLS[i % FILLS.length]} />
        ))}
        {prompt.ask === 'find' &&
          figures.map((figure, i) => {
            const { x, y } = topLeft(figure.geometry)
            return (
              <text
                key={`n${String(i)}`}
                x={x - 6}
                y={y - 4}
                fontSize={16}
                fontWeight={700}
                fill="#b5452b"
              >
                {i + 1}
              </text>
            )
          })}
      </svg>
    </figure>
  )
}

function Shape({
  geometry,
  fill,
}: {
  readonly geometry: Geometry
  readonly fill: string | undefined
}) {
  switch (geometry.type) {
    case 'circle':
      return (
        <circle
          cx={geometry.center.x}
          cy={geometry.center.y}
          r={geometry.r}
          fill={fill}
          stroke={STROKE}
          strokeWidth={3}
        />
      )
    case 'dot':
      return <circle cx={geometry.at.x} cy={geometry.at.y} r={DOT} fill={STROKE} />
    case 'polygon':
      return (
        <polygon
          points={line(geometry.points)}
          fill={fill}
          stroke={STROKE}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )
    case 'polyline':
      return (
        <g>
          <polyline
            points={line(geometry.points)}
            fill="none"
            stroke={STROKE}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {geometry.dots.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={DOT} fill={STROKE} />
          ))}
        </g>
      )
    case 'curve': {
      const { from, control, to } = geometry
      return (
        <path
          d={`M ${xy(from)} Q ${xy(control)} ${xy(to)}`}
          fill="none"
          stroke={STROKE}
          strokeWidth={3}
        />
      )
    }
  }
}

/** The corner just above and left of a shape, where its number goes. */
function topLeft(geometry: Geometry): Point {
  const points =
    geometry.type === 'circle'
      ? [{ x: geometry.center.x - geometry.r, y: geometry.center.y - geometry.r }]
      : geometry.type === 'dot'
        ? [geometry.at]
        : geometry.type === 'curve'
          ? [geometry.from, geometry.control, geometry.to]
          : geometry.points
  return {
    x: Math.min(...points.map((p) => p.x)),
    y: Math.min(...points.map((p) => p.y)),
  }
}

function xy({ x, y }: Point): string {
  return `${String(x)} ${String(y)}`
}

function line(points: readonly Point[]): string {
  return points.map(({ x, y }) => `${String(x)},${String(y)}`).join(' ')
}
