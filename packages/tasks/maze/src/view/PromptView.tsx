import type { Task } from '@cogni/core'

import { isMazeTask, mazePlugin, type Exit, type Spot } from '../logic'

/** Wide corridors and thick walls: the child follows the way with his eyes. */
const CELL = 52
const MARGIN = 40
const WALL = 7
const INK = '#2b2620'
const FLOOR = '#fbf6ea'

/** A maze with numbered gaps in its border, a treasure inside and, sometimes, a key. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isMazeTask(task)) return null
  const { size, walls, exits, treasure, key } = task.prompt
  const side = size * CELL
  const width = side + 2 * MARGIN
  const x = (column: number) => MARGIN + column * CELL
  const y = (row: number) => MARGIN + row * CELL
  const gapAt = (row: number, column: number, s: Exit['side']) =>
    exits.some((e) => e.row === row && e.column === column && e.side === s)

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const w = walls[row * size + column]
      if (!w) continue
      if (w.east && !gapAt(row, column, 'east')) {
        lines.push({ x1: x(column + 1), y1: y(row), x2: x(column + 1), y2: y(row + 1) })
      }
      if (w.south && !gapAt(row, column, 'south')) {
        lines.push({ x1: x(column), y1: y(row + 1), x2: x(column + 1), y2: y(row + 1) })
      }
      if (row === 0 && !gapAt(row, column, 'north')) {
        lines.push({ x1: x(column), y1: y(0), x2: x(column + 1), y2: y(0) })
      }
      if (column === 0 && !gapAt(row, column, 'west')) {
        lines.push({ x1: x(0), y1: y(row), x2: x(0), y2: y(row + 1) })
      }
    }
  }

  const said = mazePlugin.speak(task)
  return (
    <figure className="maze-prompt">
      <figcaption>{said}</figcaption>
      <svg
        viewBox={`0 0 ${String(width)} ${String(width)}`}
        width={width}
        height={width}
        role="img"
        aria-label={said}
      >
        <rect x={MARGIN} y={MARGIN} width={side} height={side} fill={FLOOR} />
        {lines.map((l, i) => (
          <line key={i} {...l} stroke={INK} strokeWidth={WALL} strokeLinecap="round" />
        ))}
        {exits.map((e) => (
          <Gap key={e.number} exit={e} x={x} y={y} />
        ))}
        <Star at={treasure} x={x} y={y} />
        {key && <Key at={key} x={x} y={y} />}
      </svg>
    </figure>
  )
}

type Place = (n: number) => number

/** The exit's number in a circle, just outside its gap. */
function Gap({ exit, x, y }: { readonly exit: Exit; readonly x: Place; readonly y: Place }) {
  const half = CELL / 2
  const off = MARGIN / 2
  const places: Record<Exit['side'], readonly [number, number]> = {
    north: [x(exit.column) + half, y(0) - off],
    south: [x(exit.column) + half, y(exit.row + 1) + off],
    west: [x(0) - off, y(exit.row) + half],
    east: [x(exit.column + 1) + off, y(exit.row) + half],
  }
  const [cx, cy] = places[exit.side]
  return (
    <g>
      <circle cx={cx} cy={cy} r={15} fill="#3f6fb5" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="#fff">
        {exit.number}
      </text>
    </g>
  )
}

/** The treasure: a gold star in its cell. */
function Star({ at, x, y }: { readonly at: Spot; readonly x: Place; readonly y: Place }) {
  const cx = x(at.column) + CELL / 2
  const cy = y(at.row) + CELL / 2
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 19 : 8
    const angle = (Math.PI / 5) * i - Math.PI / 2
    return `${String(cx + r * Math.cos(angle))},${String(cy + r * Math.sin(angle))}`
  }).join(' ')
  return <polygon points={points} fill="#e8b630" stroke="#9a7313" strokeWidth={2} />
}

/** The key: a ring and a bar with a tooth. */
function Key({ at, x, y }: { readonly at: Spot; readonly x: Place; readonly y: Place }) {
  const cx = x(at.column) + CELL / 2
  const cy = y(at.row) + CELL / 2
  return (
    <g stroke="#b5452b" strokeWidth={4} fill="none" strokeLinecap="round">
      <circle cx={cx - 9} cy={cy} r={7} />
      <path d={`M ${String(cx - 2)} ${String(cy)} h 16 m -5 0 v 7 m -5 -7 v 5`} />
    </g>
  )
}
