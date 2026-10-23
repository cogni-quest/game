import type { AnswerIO, Cell, Task } from '@cogni/core'
import { useState } from 'react'

import { isDictationTask, walk } from '../logic'

/** Big cells: one press on one cell, no aiming asked of the hands. */
const CELL = 56
/** Each cell is a tile with a little street round it, so the cells are easy to tell apart. */
const INSET = 3
const FRAME = 10
const INK = '#2b2620'
const PAPER = '#fbf6ea'
const PAINT = '#f3c969'
const RIGHT = '#3a7d44'
const WRONG = '#b5452b'

const same = (a: Cell, b: Cell) => a.row === b.row && a.column === b.column

/**
 * The board. Pressing a cell paints it — a draft of the path for the child's
 * own eyes, never checked. The last cell pressed is the answer, shown by a
 * magnifier; pressing it again unpaints it, pressing an earlier painted cell
 * makes that one the answer. «Здесь!» hands the answer in. Once the answer is
 * revealed, the right path is drawn over the board, from its first cell.
 *
 * The colours are attributes, the classes are for a game to theme them.
 */
export function AnswerView({ task, io }: { readonly task: Task; readonly io: AnswerIO }) {
  const [painted, setPainted] = useState<readonly Cell[]>([])
  const [given, setGiven] = useState<Cell | null>(null)
  if (!isDictationTask(task)) return null
  const { size, marked, moves, ask } = task.prompt
  const reveal = io.reveal as Cell | undefined
  const target = painted.at(-1)

  const press = (cell: Cell) => {
    if (io.disabled || same(cell, marked)) return
    if (target && same(cell, target)) setPainted(painted.slice(0, -1))
    else setPainted([...painted.filter((c) => !same(c, cell)), cell])
  }

  const side = size * CELL
  const box = side + 2 * FRAME
  const centre = (n: number) => n * CELL + CELL / 2
  const path = reveal === undefined ? [] : walk(ask === 'end' ? marked : reveal, moves)
  const cells: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) cells.push({ row, column })
  }

  return (
    <div className="dictation-answer">
      <svg
        viewBox={`${String(-FRAME)} ${String(-FRAME)} ${String(box)} ${String(box)}`}
        width={box}
        height={box}
        role="grid"
        aria-label="Поле"
      >
        <rect
          className="dictation-board"
          x={-FRAME}
          y={-FRAME}
          width={box}
          height={box}
          rx={18}
          fill="#e4d9c0"
        />
        {cells.map((cell) => {
          const isMarked = same(cell, marked)
          const isPainted = painted.some((c) => same(c, cell))
          const state = isMarked ? 'is-marked' : isPainted ? 'is-painted' : ''
          return (
            <rect
              key={`${String(cell.row)}.${String(cell.column)}`}
              className={`dictation-cell ${state}`}
              role="gridcell"
              aria-label={`ряд ${String(cell.row + 1)}, клетка ${String(cell.column + 1)}`}
              aria-selected={isPainted}
              x={cell.column * CELL + INSET}
              y={cell.row * CELL + INSET}
              width={CELL - 2 * INSET}
              height={CELL - 2 * INSET}
              rx={9}
              fill={isMarked || isPainted ? PAINT : PAPER}
              style={{ cursor: io.disabled ? 'default' : 'pointer' }}
              onClick={() => {
                press(cell)
              }}
            />
          )
        })}
        <Footprints at={marked} />
        {path.length > 1 && (
          <polyline
            className="dictation-trail"
            points={path
              .map((c) => `${String(centre(c.column))},${String(centre(c.row))}`)
              .join(' ')}
            pathLength={1}
            fill="none"
            stroke={RIGHT}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}
        {target && reveal === undefined && <Magnifier at={target} />}
        {reveal !== undefined && given && !same(given, reveal) && (
          <Ring at={given} colour={WRONG} kind="missed" />
        )}
        {reveal !== undefined && <Ring at={reveal} colour={RIGHT} kind="right" />}
      </svg>
      <div className="dictation-buttons">
        <button
          type="button"
          className="dictation-clear"
          disabled={io.disabled || painted.length === 0}
          onClick={() => {
            setPainted([])
          }}
        >
          Стереть
        </button>
        <button
          type="button"
          className="dictation-here"
          disabled={io.disabled || target === undefined}
          onClick={() => {
            if (!target) return
            setGiven(target)
            io.submit(target)
          }}
        >
          🔍 Здесь!
        </button>
      </div>
    </div>
  )
}

/** The marked cell: two footprints, the thief's trail. */
function Footprints({ at }: { readonly at: Cell }) {
  const x = at.column * CELL
  const y = at.row * CELL
  return (
    <g className="dictation-footprints" fill={INK} pointerEvents="none">
      <ellipse
        cx={x + 21}
        cy={y + 33}
        rx={6.5}
        ry={10}
        transform={`rotate(-12 ${String(x + 21)} ${String(y + 33)})`}
      />
      <ellipse
        cx={x + 36}
        cy={y + 22}
        rx={6.5}
        ry={10}
        transform={`rotate(12 ${String(x + 36)} ${String(y + 22)})`}
      />
    </g>
  )
}

/** The answer before it is handed in: a magnifier over the cell. */
function Magnifier({ at }: { readonly at: Cell }) {
  const cx = at.column * CELL + CELL / 2 - 3
  const cy = at.row * CELL + CELL / 2 - 3
  return (
    <g className="dictation-magnifier" pointerEvents="none">
      <line
        x1={cx + 12}
        y1={cy + 12}
        x2={cx + 22}
        y2={cy + 22}
        stroke={INK}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={16}
        fill="rgba(255, 255, 255, 0.35)"
        stroke={INK}
        strokeWidth={5}
      />
    </g>
  )
}

/** A thick ring round a cell: the right cell or the missed one. */
function Ring({
  at,
  colour,
  kind,
}: {
  readonly at: Cell
  readonly colour: string
  readonly kind: 'right' | 'missed'
}) {
  return (
    <rect
      className={`dictation-ring ${kind}`}
      x={at.column * CELL + 4}
      y={at.row * CELL + 4}
      width={CELL - 8}
      height={CELL - 8}
      rx={10}
      fill="none"
      stroke={colour}
      strokeWidth={5}
      pointerEvents="none"
    />
  )
}
