import type { Task } from '@cogni/core'

import { isMoneyTask, isNote, moneyPlugin } from '../logic'

const WIDTH = 420
const GAP = 14
const NOTE_WIDTH = 140
const NOTE_HEIGHT = 72

/** Coins as round labelled discs, a note as a labelled rectangle. */
const RADIUS: Record<number, number> = { 1: 30, 2: 32, 5: 35, 10: 38 }

/** Coins and notes in rows; or a price tag beside the coin or note given. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isMoneyTask(task)) return null
  const said = moneyPlugin.speak(task)
  const { prompt } = task
  if (prompt.ask === 'change') {
    return (
      <figure className="money-prompt">
        <figcaption>{said}</figcaption>
        <svg viewBox="0 0 420 150" width={420} height={150} role="img" aria-label={said}>
          <Tag x={20} y={30} price={prompt.price} />
          <text x={140} y={20} fontSize={18} fill="#5a4a2a">
            цена
          </text>
          <text x={300} y={20} fontSize={18} fill="#5a4a2a" textAnchor="middle">
            дали
          </text>
          <Money value={prompt.from} x={300} y={85} />
        </svg>
      </figure>
    )
  }
  const items = prompt.ask === 'make' ? prompt.purse : prompt.items
  const placed = layout(items)
  const height = Math.max(...placed.map((p) => p.bottom)) + GAP
  return (
    <figure className="money-prompt">
      <figcaption>{said}</figcaption>
      <svg
        viewBox={`0 0 ${String(WIDTH)} ${String(height)}`}
        width={WIDTH}
        height={height}
        role="img"
        aria-label={said}
      >
        {placed.map((p, i) => (
          <Money key={i} value={p.value} x={p.x} y={p.y} />
        ))}
      </svg>
    </figure>
  )
}

interface Placed {
  readonly value: number
  /** Centre of the coin or note. */
  readonly x: number
  readonly y: number
  readonly bottom: number
}

/** Left to right, wrapping into a new row when the line is full. */
function layout(items: readonly number[]): Placed[] {
  const placed: Placed[] = []
  let x = GAP
  let rowTop = GAP
  let rowHeight = 0
  for (const value of items) {
    const [w, h] = isNote(value)
      ? [NOTE_WIDTH, NOTE_HEIGHT]
      : [2 * radius(value), 2 * radius(value)]
    if (x + w > WIDTH - GAP) {
      x = GAP
      rowTop += rowHeight + GAP
      rowHeight = 0
    }
    placed.push({ value, x: x + w / 2, y: rowTop + h / 2, bottom: rowTop + h })
    x += w + GAP
    rowHeight = Math.max(rowHeight, h)
  }
  return placed
}

function radius(value: number): number {
  return RADIUS[value] ?? 30
}

function Money({
  value,
  x,
  y,
}: {
  readonly value: number
  readonly x: number
  readonly y: number
}) {
  if (isNote(value)) {
    return (
      <g>
        <rect
          x={x - NOTE_WIDTH / 2}
          y={y - NOTE_HEIGHT / 2}
          width={NOTE_WIDTH}
          height={NOTE_HEIGHT}
          rx={6}
          fill={value === 50 ? '#9cc3e0' : '#c9b38a'}
          stroke="#5a4a2a"
          strokeWidth={2}
        />
        <text x={x} y={y + 10} textAnchor="middle" fontSize={28} fontWeight={700} fill="#2b2b2b">
          {value} р
        </text>
      </g>
    )
  }
  const r = radius(value)
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={value === 10 ? '#e2c15a' : '#d5d9de'}
        stroke="#6b6b6b"
        strokeWidth={2}
      />
      <text x={x} y={y + 8} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2b2b2b">
        {value} р
      </text>
    </g>
  )
}

function Tag({ x, y, price }: { readonly x: number; readonly y: number; readonly price: number }) {
  return (
    <g>
      <path
        d={`M ${String(x)} ${String(y + 50)} l 40 -45 h 140 v 90 h -140 z`}
        fill="#fff7e0"
        stroke="#5a4a2a"
        strokeWidth={2}
      />
      <circle cx={x + 30} cy={y + 50} r={6} fill="none" stroke="#5a4a2a" strokeWidth={2} />
      <text
        x={x + 110}
        y={y + 62}
        textAnchor="middle"
        fontSize={34}
        fontWeight={700}
        fill="#2b2b2b"
      >
        {price} р
      </text>
    </g>
  )
}
