import { firstMistake, type AnswerIO, type Cell, type OrderedCell, type Task } from '@cogni/core'
import { useEffect, useRef, useState } from 'react'

import { isLightsTask, type Colour } from '../logic'

/** Big lights: one press on one light, no aiming asked of the hands. */
const SLOT: Record<number, number> = { 3: 92, 4: 78, 5: 66 }
const FRAME = 14

/** The pace of the flashes: calm enough to see each one, never a race. */
const LEAD = 600
const LIT = 700
const GAP = 350
/** The right order after a miss is shown slower, to be watched and learned. */
const REPLAY_LEAD = 500
const REPLAY_STEP = 900

const PANEL = '#1d2740'
const OFF = '#34405f'
/**
 * A plain flash — one that is not a colour of the task. A game themes it
 * through the one CSS variable `--lights-flash`; the colours of a coloured
 * task are the task's own and no theme reaches them.
 */
const FLASH = 'var(--lights-flash, #6fe8ff)'
const PRESSED = '#f3c969'
const RIGHT = '#5fd38d'
const WRONG = '#ff6b5b'
const LABEL = '#13203a'

/** How a colour of the task looks, and what it is called on its button. */
const PAINT: Record<Colour, { readonly hex: string; readonly name: string }> = {
  red: { hex: '#ff5a5a', name: 'красный' },
  blue: { hex: '#4d8bff', name: 'синий' },
  yellow: { hex: '#ffd23f', name: 'жёлтый' },
  green: { hex: '#3fd17a', name: 'зелёный' },
}

/** A colour's look; an unknown name — not one of ours — falls back to a plain light, not a crash. */
const hexOf = (colour: string | undefined): string | undefined =>
  colour === undefined
    ? undefined
    : (PAINT as Partial<Record<string, { readonly hex: string }>>)[colour]?.hex

const samePlace = (a: Cell, b: Cell) => a.row === b.row && a.column === b.column

/** One empty list for a task that is not ours, so the effects do not rerun on every render. */
const NONE: readonly OrderedCell[] = []

/**
 * - `ready` — the panel is dark until the child presses «Смотреть», so the
 *   flashes never start before the eyes are on them;
 * - `showing` — the lights flash one by one, the panel cannot be pressed;
 * - `input` — the child presses the lights back; «Назад» takes back the last
 *   press, «Готово» hands the order in once it is full.
 */
type Phase = 'ready' | 'showing' | 'input'

/**
 * What the panel tells the game through `io.cue`, for its sounds: the show
 * starts, a light flashes, a light is pressed or taken back, a colour is
 * chosen, a light of the right order is played back after a miss. Every flash
 * is the same event — a sound per light would be a second clue to the place.
 */
export type LightsCue = 'show' | 'flash' | 'press' | 'undo' | 'choose' | 'replay'

/**
 * The panel of lights. The flashes are shown once — a memory task shown again
 * would be a different task. When the colour is asked, a row of colour
 * buttons sits under the panel: choose a colour, then press the light, and it
 * lights in that colour. After a miss the right order is played again,
 * slowly, and stays on the panel numbered — in its colours — with the first
 * wrong press marked: the child sees where the order broke, and whether it
 * was the place or the colour.
 *
 * The classes are for a game to theme the panel; the plain flash colour is
 * the `--lights-flash` variable.
 */
export function AnswerView({ task, io }: { readonly task: Task; readonly io: AnswerIO }) {
  // A board opened with its answer already out — the stand's overview — is
  // drawn finished at once, with nothing to play.
  const [revealedAtStart] = useState(io.reveal !== undefined)
  const [phase, setPhase] = useState<Phase>(revealedAtStart ? 'input' : 'ready')
  const [flash, setFlash] = useState<number | null>(null)
  const [pressed, setPressed] = useState<readonly OrderedCell[]>([])
  const [given, setGiven] = useState<readonly OrderedCell[] | null>(null)
  const [brush, setBrush] = useState<Colour | null>(null)
  const [replayed, setReplayed] = useState(() =>
    revealedAtStart && isLightsTask(task) ? task.answer.expected.length : 0,
  )

  const lights = isLightsTask(task) ? task.prompt.shown : NONE
  const reveal = io.reveal as readonly OrderedCell[] | undefined

  // The game's listener, kept in a ref: the timers below must not restart
  // whenever the game hands a new `io`.
  const cueRef = useRef(io.cue)
  useEffect(() => {
    cueRef.current = io.cue
  })
  const cue = (event: LightsCue) => {
    cueRef.current?.(event)
  }

  useEffect(() => {
    if (phase !== 'showing') return
    const timers = lights.flatMap((_, i) => {
      const on = LEAD + i * (LIT + GAP)
      return [
        setTimeout(() => {
          setFlash(i)
          cueRef.current?.('flash')
        }, on),
        setTimeout(() => {
          setFlash(null)
        }, on + LIT),
      ]
    })
    timers.push(
      setTimeout(
        () => {
          setPhase('input')
        },
        LEAD + lights.length * (LIT + GAP),
      ),
    )
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [phase, lights])

  useEffect(() => {
    if (reveal === undefined || revealedAtStart) return
    const timers = reveal.map((_, i) =>
      setTimeout(
        () => {
          setReplayed(i + 1)
          cueRef.current?.('replay')
        },
        REPLAY_LEAD + i * REPLAY_STEP,
      ),
    )
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [reveal, revealedAtStart])

  if (!isLightsTask(task)) return null
  const { size, colours } = task.prompt
  const coloured = colours !== undefined
  const length = lights.length
  const slot = SLOT[size] ?? 66
  const box = size * slot + 2 * FRAME
  const centre = (n: number) => n * slot + slot / 2

  const finished = io.disabled && given !== null
  const right = finished && reveal === undefined
  const mistake = reveal !== undefined && given !== null ? firstMistake(reveal, given) : null
  const canPress = phase === 'input' && !io.disabled && reveal === undefined
  const needsBrush = coloured && brush === null

  const press = (cell: Cell) => {
    if (!canPress || needsBrush || pressed.length >= length) return
    if (pressed.some((c) => samePlace(c, cell))) return
    setPressed([...pressed, brush === null ? cell : { ...cell, colour: brush }])
    cue('press')
  }

  const cells: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) cells.push({ row, column })
  }

  /** How a light looks, and the number on it: its place in the order shown or pressed. */
  const look = (cell: Cell): { fill: string; state: string; number?: number } => {
    if (reveal !== undefined) {
      const index = reveal.findIndex((c) => samePlace(c, cell))
      const want = reveal[index]
      if (want && index < replayed) {
        const latest = index === replayed - 1 && replayed < reveal.length
        const own = hexOf(want.colour)
        return {
          fill: own ?? (latest ? FLASH : RIGHT),
          state: latest ? 'is-shown-right is-latest' : 'is-shown-right',
          number: index + 1,
        }
      }
      return { fill: OFF, state: '' }
    }
    const shownNow = flash === null ? undefined : lights[flash]
    if (shownNow && samePlace(shownNow, cell)) {
      return { fill: hexOf(shownNow.colour) ?? FLASH, state: 'is-flash' }
    }
    const index = pressed.findIndex((c) => samePlace(c, cell))
    const mine = pressed[index]
    if (mine) {
      const own = hexOf(mine.colour)
      return {
        fill: own ?? (right ? RIGHT : PRESSED),
        state: right ? 'is-right' : 'is-pressed',
        number: index + 1,
      }
    }
    return { fill: OFF, state: '' }
  }

  const missed = mistake === null ? undefined : given?.[mistake]
  const wanted = mistake === null ? undefined : reveal?.[mistake]

  /** The line under the panel: what to do now, or what went wrong. */
  const status = (): string => {
    if (reveal !== undefined) {
      if (mistake === null || missed === undefined) return 'Правильный порядок — по номерам'
      const what = wanted && samePlace(missed, wanted) ? 'не тот цвет на' : 'сбился на'
      return `Ошибка: ${what} ${String(mistake + 1)}-м огоньке. Правильно — по номерам`
    }
    if (phase === 'ready') {
      return coloured ? 'Запомни, где и каким цветом. Готов?' : 'Готов? Смотри внимательно'
    }
    if (phase === 'showing') return 'Смотри и запоминай…'
    if (right) return 'Всё верно!'
    if (needsBrush) return 'Выбери цвет, потом нажми огонёк'
    return `Нажато ${String(pressed.length)} из ${String(length)}`
  }

  return (
    <div className={`lights-answer phase-${phase}${coloured ? ' is-coloured' : ''}`}>
      <svg
        viewBox={`${String(-FRAME)} ${String(-FRAME)} ${String(box)} ${String(box)}`}
        width={box}
        height={box}
        role="grid"
        aria-label="Панель огоньков"
      >
        <rect
          className="lights-panel"
          x={-FRAME}
          y={-FRAME}
          width={box}
          height={box}
          rx={22}
          fill={PANEL}
        />
        {cells.map((cell) => {
          const { fill, state, number } = look(cell)
          const cx = centre(cell.column)
          const cy = centre(cell.row)
          return (
            <g
              key={`${String(cell.row)}.${String(cell.column)}`}
              className={`lights-light ${state}`}
              role="gridcell"
              aria-label={`ряд ${String(cell.row + 1)}, огонёк ${String(cell.column + 1)}${
                number === undefined ? '' : `, номер ${String(number)}`
              }`}
              style={{ cursor: canPress && !needsBrush ? 'pointer' : 'default' }}
              onClick={() => {
                press(cell)
              }}
            >
              {state === 'is-flash' && (
                <circle
                  className="lights-halo"
                  cx={cx}
                  cy={cy}
                  r={slot * 0.38}
                  fill="none"
                  style={{ stroke: fill }}
                  strokeWidth={4}
                  pointerEvents="none"
                />
              )}
              {/* As a style, not an attribute: only a style takes the theme's `var()`. */}
              <circle className="lights-bulb" cx={cx} cy={cy} r={slot * 0.38} style={{ fill }} />
              <circle
                cx={cx - slot * 0.1}
                cy={cy - slot * 0.12}
                r={slot * 0.09}
                fill="rgba(255, 255, 255, 0.35)"
                pointerEvents="none"
              />
              {number !== undefined && (
                <text
                  x={cx}
                  y={cy}
                  dy="0.36em"
                  textAnchor="middle"
                  fontSize={slot * 0.36}
                  fontWeight={800}
                  fill={LABEL}
                  pointerEvents="none"
                >
                  {number}
                </text>
              )}
            </g>
          )
        })}
        {missed && replayed >= length && (
          <circle
            className="lights-missed"
            cx={centre(missed.column)}
            cy={centre(missed.row)}
            r={slot * 0.46}
            fill="none"
            stroke={WRONG}
            strokeWidth={6}
            strokeDasharray="10 7"
            pointerEvents="none"
          />
        )}
      </svg>

      <p className="lights-status" role="status">
        {status()}
      </p>

      {coloured && phase === 'input' && !io.disabled && (
        <div className="lights-palette" role="radiogroup" aria-label="Цвет">
          {colours.map((colour) => (
            <button
              key={colour}
              type="button"
              role="radio"
              aria-checked={brush === colour}
              aria-label={PAINT[colour].name}
              className={`lights-colour colour-${colour}${brush === colour ? ' is-chosen' : ''}`}
              style={{ backgroundColor: PAINT[colour].hex }}
              disabled={!canPress}
              onClick={() => {
                setBrush(colour)
                cue('choose')
              }}
            />
          ))}
        </div>
      )}

      {!io.disabled && (
        <div className="lights-buttons">
          {phase === 'ready' ? (
            <button
              type="button"
              className="lights-watch"
              onClick={() => {
                setPhase('showing')
                cue('show')
              }}
            >
              ▶ Смотреть
            </button>
          ) : (
            <>
              <button
                type="button"
                className="lights-undo"
                disabled={!canPress || pressed.length === 0}
                onClick={() => {
                  setPressed(pressed.slice(0, -1))
                  cue('undo')
                }}
              >
                ↶ Назад
              </button>
              <button
                type="button"
                className="lights-done"
                disabled={!canPress || pressed.length < length}
                onClick={() => {
                  setGiven(pressed)
                  io.submit(pressed)
                }}
              >
                Готово
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
