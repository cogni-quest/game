import type { AnswerIO, Cell, Task } from '@cogni/core'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import {
  anchorsOf,
  clueSegments,
  floorOf,
  isSpyHouseTask,
  narrowing,
  type Clue,
  type House,
} from '../logic'
import { PICTURE } from './pictures'
import { Words } from './Report'

/** A window and the wall around it; big enough for one press, no aiming asked of the hands. */
const SLOT = 78
const GLASS = 60
/** The wall's edge beside the outer windows, and the margin left of it for the floor numbers. */
const WALL = 18
const LABELS = 34
const ROOF = 46
const GROUND = 26

/**
 * After a miss the spy first giggles in his window, then runs off along the
 * ledge — a little scene, so a miss is funny rather than a scolding — and only
 * then the walk-through starts: calm, one clue at a time.
 */
const GIGGLE = 1800
const RUN = 2200
const LEAD = GIGGLE + RUN + 500
const STEP = 1900

/**
 * - `choose` — a window is picked (or picked again);
 * - `giggle` — the missed spy laughs in his window;
 * - `run` — he runs off;
 * - `replay` — the walk-through shows the next clue.
 */
export type SpyHouseCue = 'choose' | 'giggle' | 'run' | 'replay'

/** Where the missed spy is in his getaway: laughing, running, gone — a shadow left in the window. */
type Escape = 'giggle' | 'run' | 'gone'

/** How the missed spy laughs: a different laugh each time, so the scene does not wear thin. */
const LAUGHS = ['Хи-хи!', 'Ха-ха!', 'Хе-хе!'] as const
type Laugh = (typeof LAUGHS)[number]

function anyLaugh(): Laugh {
  return LAUGHS[Math.floor(Math.random() * LAUGHS.length)] ?? 'Хи-хи!'
}

const same = (a: Cell, b: Cell) => a.row === b.row && a.column === b.column
const has = (cells: readonly Cell[], cell: Cell) => cells.some((c) => same(c, cell))

/** One empty array for a task that is not ours, so the effects do not rerun on every render. */
const NO_CLUES: readonly Clue[] = []
const NO_HOUSE: House = []

/**
 * The house of five floors. A press picks a window — the picked one is
 * ringed — and «Поймать!» hands it in, so a slip of the finger costs nothing.
 *
 * After a right answer the spy shows in the window. After a miss the spy shows
 * where it really was, the window picked is crossed out, and the report is
 * walked through clue by clue: the windows each clue rules out dim; the floor
 * clue brings out the floor numbers, a count — the numbers over the windows
 * from its side, a landmark clue — an arrow from the landmark. All of this is
 * shown only after the answer, never while it is being looked for.
 */
export function AnswerView({ task, io }: { readonly task: Task; readonly io: AnswerIO }) {
  // A board opened with its answer already out — the stand's overview — is drawn finished at once.
  const [revealedAtStart] = useState(io.reveal !== undefined)
  const [chosen, setChosen] = useState<Cell | null>(null)
  const [given, setGiven] = useState<Cell | null>(null)
  const clues = isSpyHouseTask(task) ? task.prompt.clues : NO_CLUES
  const house = isSpyHouseTask(task) ? task.prompt.house : NO_HOUSE
  const [step, setStep] = useState(() => (revealedAtStart ? clues.length : 0))
  const [escape, setEscape] = useState<Escape>(revealedAtStart ? 'gone' : 'giggle')
  const [laugh] = useState(anyLaugh)

  const reveal = io.reveal as Cell | undefined

  const cueRef = useRef(io.cue)
  useEffect(() => {
    cueRef.current = io.cue
  })

  useEffect(() => {
    if (reveal === undefined || revealedAtStart) return
    cueRef.current?.('giggle')
    const getaway = [
      setTimeout(() => {
        setEscape('run')
        cueRef.current?.('run')
      }, GIGGLE),
      setTimeout(() => {
        setEscape('gone')
      }, GIGGLE + RUN),
    ]
    const timers = clues.map((_, i) =>
      setTimeout(
        () => {
          setStep(i + 1)
          cueRef.current?.('replay')
        },
        LEAD + i * STEP,
      ),
    )
    return () => {
      ;[...getaway, ...timers].forEach(clearTimeout)
    }
  }, [reveal, revealedAtStart, clues])

  if (!isSpyHouseTask(task)) return null
  const { floors, windows } = task.prompt

  const right = io.disabled && given !== null && reveal === undefined
  const canPick = !io.disabled && reveal === undefined
  const spyAt = reveal ?? (right ? given : null)
  const walking = reveal !== undefined
  const inPlay = walking ? (narrowing(house, clues)[step] ?? []) : []
  const current = walking && step > 0 ? clues[step - 1] : undefined

  const width = LABELS + 2 * WALL + windows * SLOT
  const height = ROOF + floors * SLOT + GROUND
  const x = (column: number) => LABELS + WALL + column * SLOT + SLOT / 2
  const y = (row: number) => ROOF + row * SLOT + SLOT / 2

  const pick = (cell: Cell) => {
    if (!canPick) return
    setChosen(cell)
    cueRef.current?.('choose')
  }

  const cells: Cell[] = house.flatMap((floor, row) => floor.map((_, column) => ({ row, column })))

  /** The arrows of a landmark clue: from each landmark it leans on to each window still in play. */
  const arrows =
    current === undefined
      ? []
      : inPlay.flatMap((cell) => anchorsOf(current, cell).map((from) => ({ from, to: cell })))

  /** The landmarks those arrows start from stay bright, though no spy can be in them. */
  const anchors = arrows.map((a) => a.from)

  /** How a window looks now: dimmed once a clue of the walk-through rules it out. */
  const stateOf = (cell: Cell): string => {
    const marks: string[] = []
    if ((house[cell.row]?.[cell.column] ?? null) !== null) marks.push('has-landmark')
    if (chosen && same(chosen, cell) && !walking) marks.push('is-chosen')
    if (has(anchors, cell)) marks.push('is-anchor')
    else if (walking && step > 0 && !has(inPlay, cell)) marks.push('is-out')
    if (spyAt && same(spyAt, cell)) marks.push(right ? 'is-caught' : 'is-spy')
    return marks.join(' ')
  }

  const status = (): string => {
    if (walking) {
      if (escape === 'giggle') return `${laugh} Шпион смеётся: ты его не нашёл…`
      if (escape === 'run') return 'Шпион убегает по карнизу!'
      if (step === 0) return 'Убежал! Разберём донесение по шагам.'
      if (step < clues.length) return 'Смотри, какие окна остались…'
      return 'Подходит только одно окно — там и был шпион.'
    }
    if (right) return 'Попался!'
    if (chosen) return 'Окно выбрано. Проверь донесение ещё раз — и лови!'
    return 'Найди окно шпиона и нажми на него'
  }

  return (
    <div className={`spy-answer${walking ? ' is-walking' : ''}${right ? ' is-right' : ''}`}>
      <svg
        className="spy-house"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        height={height}
        role="grid"
        aria-label="Дом"
      >
        <defs>
          <marker
            id="spy-arrow-head"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={5}
            markerHeight={5}
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" className="spy-arrow-head" />
          </marker>
        </defs>

        <Building floors={floors} windows={windows} />

        {cells.map((cell) => {
          const landmark = house[cell.row]?.[cell.column] ?? null
          const cx = x(cell.column)
          const cy = y(cell.row)
          return (
            <g
              key={`${String(cell.row)}.${String(cell.column)}`}
              className={`spy-window ${stateOf(cell)}`}
              role="gridcell"
              aria-label={`${String(floorOf(cell.row))} этаж, окно ${String(cell.column + 1)}`}
              style={{ cursor: canPick ? 'pointer' : 'default' }}
              onClick={() => {
                pick(cell)
              }}
            >
              <rect
                className="spy-glass"
                x={cx - GLASS / 2}
                y={cy - GLASS / 2}
                width={GLASS}
                height={GLASS}
                rx={6}
              />
              <line
                className="spy-frame"
                x1={cx}
                y1={cy - GLASS / 2}
                x2={cx}
                y2={cy + GLASS / 2}
                pointerEvents="none"
              />
              <rect
                className="spy-sill"
                x={cx - GLASS / 2 - 4}
                y={cy + GLASS / 2}
                width={GLASS + 8}
                height={5}
                rx={2}
                pointerEvents="none"
              />
              {landmark !== null && (
                <text
                  className="spy-window-landmark"
                  x={cx}
                  y={cy}
                  dy="0.35em"
                  textAnchor="middle"
                  fontSize={GLASS * 0.58}
                  pointerEvents="none"
                >
                  {PICTURE[landmark]}
                </text>
              )}
              {right && spyAt && same(spyAt, cell) && <Spy cx={cx} cy={cy} />}
              {reveal !== undefined && escape === 'gone' && same(reveal, cell) && (
                <Spy cx={cx} cy={cy} mood="ghost" />
              )}
            </g>
          )
        })}

        {reveal !== undefined && escape !== 'gone' && (
          <Getaway
            cx={x(reveal.column)}
            cy={y(reveal.row)}
            escape={escape}
            laugh={laugh}
            width={width}
          />
        )}

        {chosen && !walking && !right && (
          <circle
            className="spy-reticle"
            cx={x(chosen.column)}
            cy={y(chosen.row)}
            r={GLASS * 0.62}
            pointerEvents="none"
          />
        )}

        {reveal !== undefined && given && !same(given, reveal) && (
          <g className="spy-missed" pointerEvents="none">
            {[-1, 1].map((d) => (
              <line
                key={d}
                x1={x(given.column) - 20}
                y1={y(given.row) - 20 * d}
                x2={x(given.column) + 20}
                y2={y(given.row) + 20 * d}
              />
            ))}
          </g>
        )}

        {walking && current?.kind === 'floor' && (
          <rect
            className="spy-floor-band"
            x={LABELS + 4}
            y={ROOF + (floors - current.floor) * SLOT + 3}
            width={windows * SLOT + 2 * WALL - 8}
            height={SLOT - 6}
            rx={8}
            pointerEvents="none"
          />
        )}

        {walking && step > 0 && clues.slice(0, step).some((c) => c.kind === 'floor') && (
          <g className="spy-floor-numbers" pointerEvents="none">
            {Array.from({ length: floors }, (_, row) => (
              <text
                key={row}
                x={LABELS / 2}
                y={y(row)}
                dy="0.35em"
                textAnchor="middle"
                className={
                  current?.kind === 'floor' && current.floor === floorOf(row) ? 'is-asked' : ''
                }
              >
                {floorOf(row)}
              </text>
            ))}
          </g>
        )}

        {walking && current?.kind === 'ordinal' && (
          <g className="spy-count" pointerEvents="none">
            {Array.from({ length: windows }, (_, i) => {
              const column = current.side === 'left' ? i : windows - 1 - i
              return (
                <text
                  key={i}
                  x={x(column)}
                  y={ROOF - 12}
                  textAnchor="middle"
                  className={i + 1 === current.place ? 'is-asked' : ''}
                >
                  {i + 1}
                </text>
              )
            })}
          </g>
        )}

        {arrows.map(({ from, to }, i) => {
          const dx = x(to.column) - x(from.column)
          const dy = y(to.row) - y(from.row)
          const length = Math.max(Math.hypot(dx, dy), 1)
          const trim = GLASS * 0.32
          return (
            <line
              key={i}
              className="spy-arrow"
              x1={x(from.column) + (dx / length) * trim}
              y1={y(from.row) + (dy / length) * trim}
              x2={x(to.column) - (dx / length) * trim}
              y2={y(to.row) - (dy / length) * trim}
              markerEnd="url(#spy-arrow-head)"
              pointerEvents="none"
            />
          )
        })}
      </svg>

      <p className="spy-status" role="status">
        {status()}
      </p>

      {walking && (
        <ol className="spy-steps" aria-label="Разбор донесения">
          {clues.map((clue, i) => (
            <li
              key={i}
              className={i < step - 1 ? 'is-done' : i === step - 1 ? 'is-now' : 'is-todo'}
            >
              <span className="spy-step-mark" aria-hidden="true">
                {i < step ? '✔' : '○'}
              </span>
              <Words segments={clueSegments(clue, windows)} />
            </li>
          ))}
        </ol>
      )}

      {!io.disabled && (
        <div className="spy-buttons">
          <button
            type="button"
            className="spy-catch"
            disabled={!canPick || chosen === null}
            onClick={() => {
              if (!chosen) return
              setGiven(chosen)
              io.submit(chosen)
            }}
          >
            🔦 Поймать!
          </button>
        </div>
      )}
    </div>
  )
}

/** The facade: a flat roof with an antenna, the wall, the street. */
function Building({ floors, windows }: { readonly floors: number; readonly windows: number }) {
  const left = LABELS
  const wide = windows * SLOT + 2 * WALL
  const top = ROOF
  const tall = floors * SLOT
  return (
    <g className="spy-building" pointerEvents="none">
      <line
        className="spy-antenna"
        x1={left + wide - 26}
        y1={top - 6}
        x2={left + wide - 26}
        y2={8}
      />
      <circle className="spy-antenna-light" cx={left + wide - 26} cy={8} r={4} />
      <rect className="spy-roof" x={left - 8} y={top - 14} width={wide + 16} height={14} rx={3} />
      <rect className="spy-wall" x={left} y={top} width={wide} height={tall} />
      {Array.from({ length: floors - 1 }, (_, i) => (
        <line
          key={i}
          className="spy-ledge"
          x1={left}
          y1={top + (i + 1) * SLOT}
          x2={left + wide}
          y2={top + (i + 1) * SLOT}
        />
      ))}
      <rect className="spy-street" x={0} y={top + tall} width={left + wide + 8} height={GROUND} />
    </g>
  )
}

/**
 * The missed spy's getaway, drawn over everything: he laughs in his window
 * («Хи-хи!», «Ха-ха!» or «Хе-хе!»), then hops onto the ledge and runs the
 * long way — towards the farther edge of the house, past the other windows —
 * out of the picture.
 */
function Getaway({
  cx,
  cy,
  escape,
  laugh,
  width,
}: {
  readonly cx: number
  readonly cy: number
  readonly escape: 'giggle' | 'run'
  readonly laugh: Laugh
  readonly width: number
}) {
  const towards = cx > width / 2 ? -1 : 1
  const away = towards < 0 ? -(cx + 60) : width - cx + 60
  // The bubble goes where there is room for it: to the right of the spy if it fits, else to the left.
  const bubbleRight = width - cx >= 84
  const bubbleX = bubbleRight ? 6 : -78
  return (
    <g pointerEvents="none">
      <Spy cx={cx} cy={cy} mood={escape} run={away} />
      {escape === 'giggle' && (
        <g
          className="spy-giggle"
          transform={`translate(${String(cx + bubbleX)} ${String(cy - GLASS / 2 - 30)})`}
        >
          <rect width={72} height={28} rx={12} />
          <path d={bubbleRight ? 'M8 26 L4 38 L20 26 Z' : 'M52 26 L68 38 L64 26 Z'} />
          <text x={36} y={19} textAnchor="middle">
            {laugh}
          </text>
        </g>
      )}
    </g>
  )
}

/** The spy: a hat, dark glasses, a raised collar — and legs, shown only when he runs. */
function Spy({
  cx,
  cy,
  mood = 'caught',
  run = 0,
}: {
  readonly cx: number
  readonly cy: number
  readonly mood?: 'caught' | 'giggle' | 'run' | 'ghost'
  /** How far he runs, sideways, in the house's units. */
  readonly run?: number
}) {
  return (
    // Placed by the outer group, animated by the inner one: a CSS transform would replace the placing.
    <g transform={`translate(${String(cx)} ${String(cy)})`} pointerEvents="none">
      <g
        className={`spy-figure is-${mood}`}
        style={{ '--spy-run': `${String(run)}px` } as CSSProperties}
      >
        <g className="spy-legs">
          <line className="spy-leg a" x1={-7} y1={26} x2={-9} y2={42} />
          <line className="spy-leg b" x1={7} y1={26} x2={9} y2={42} />
        </g>
        <path className="spy-coat" d="M-22 30 Q-20 6 0 4 Q20 6 22 30 Z" />
        <path className="spy-collar" d="M-12 6 L-4 16 L0 6 L4 16 L12 6 Z" />
        <circle className="spy-face" cx={0} cy={-6} r={11} />
        <rect className="spy-glasses" x={-10} y={-9} width={20} height={6} rx={3} />
        {mood === 'giggle' && <path className="spy-grin" d="M-6 0 Q0 6 6 0 Z" />}
        <ellipse className="spy-hat-brim" cx={0} cy={-15} rx={18} ry={4} />
        <rect className="spy-hat" x={-10} y={-27} width={20} height={13} rx={4} />
      </g>
    </g>
  )
}
