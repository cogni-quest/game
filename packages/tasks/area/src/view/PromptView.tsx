import type { Task } from '@cogni/core'
import type { ReactNode } from 'react'

import { areaPlugin, COMPARE_GRID, GRID, isAreaTask, type Cell } from '../logic'

const CELL = 36
const GAP = 48
const STROKE = '#3b3428'
const LINES = '#cfc6b0'

/** Figures of cells on a grid, or a rectangle with its two sides written. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isAreaTask(task)) return null
  const { prompt } = task
  const said = areaPlugin.speak(task)
  const svg = (width: number, height: number, children: ReactNode) => (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
      aria-label={said}
    >
      {children}
    </svg>
  )
  return (
    <figure className="area-prompt">
      <figcaption>{said}</figcaption>
      {prompt.ask === 'cells' &&
        svg(
          GRID.columns * CELL + 2,
          GRID.rows * CELL + 2,
          <Grid columns={GRID.columns} rows={GRID.rows} cells={prompt.cells} fill="#f2c48d" />,
        )}
      {prompt.ask === 'compare' &&
        svg(
          2 * COMPARE_GRID.columns * CELL + GAP + 2,
          COMPARE_GRID.rows * CELL + 2,
          <>
            <Grid {...COMPARE_GRID} cells={prompt.left} fill="#c94c3c" />
            <g transform={`translate(${String(COMPARE_GRID.columns * CELL + GAP)} 0)`}>
              <Grid {...COMPARE_GRID} cells={prompt.right} fill="#3f6fb5" />
            </g>
          </>,
        )}
      {prompt.ask === 'sides' && <Sides width={prompt.width} height={prompt.height} />}
    </figure>
  )
}

function Grid({
  columns,
  rows,
  cells,
  fill,
}: {
  readonly columns: number
  readonly rows: number
  readonly cells: readonly Cell[]
  readonly fill: string
}) {
  return (
    <g transform="translate(1 1)">
      {cells.map(([c, r]) => (
        <rect
          key={`${String(c)},${String(r)}`}
          x={c * CELL}
          y={r * CELL}
          width={CELL}
          height={CELL}
          fill={fill}
        />
      ))}
      {Array.from({ length: columns + 1 }, (_, i) => (
        <line
          key={`c${String(i)}`}
          x1={i * CELL}
          x2={i * CELL}
          y1={0}
          y2={rows * CELL}
          stroke={LINES}
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line
          key={`r${String(i)}`}
          x1={0}
          x2={columns * CELL}
          y1={i * CELL}
          y2={i * CELL}
          stroke={LINES}
        />
      ))}
    </g>
  )
}

/** A rectangle roughly to scale, with its width below and its height on the left. */
function Sides({ width, height }: { readonly width: number; readonly height: number }) {
  const unit = Math.min(300 / width, 180 / height)
  const w = width * unit
  const h = height * unit
  const left = 70
  const top = 20
  return (
    <svg
      viewBox={`0 0 ${String(w + left + 30)} ${String(h + top + 50)}`}
      width={w + left + 30}
      height={h + top + 50}
      role="img"
    >
      <rect x={left} y={top} width={w} height={h} fill="#c5dca0" stroke={STROKE} strokeWidth={4} />
      <text
        x={left + w / 2}
        y={top + h + 34}
        textAnchor="middle"
        fontSize={22}
        fontWeight={700}
        fill="#1f4e8c"
      >
        {width} см
      </text>
      <text
        x={left - 12}
        y={top + h / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={22}
        fontWeight={700}
        fill="#1f4e8c"
      >
        {height} см
      </text>
    </svg>
  )
}
