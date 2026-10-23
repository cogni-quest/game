import { numberWords, type Task } from '@cogni/core'

import { additionPlugin, isAdditionTask } from '../logic'

/** The typographic minus, wider than a hyphen and level with the plus. */
const MINUS = '−'

const CELL = 30
const FRAME = 5

/**
 * «8 + 5 = ?» — big numbers and plenty of air; or counters in ten-frames; or
 * the example in words. Takes any task, as the game hands it over, and draws
 * nothing for one that is not its own.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isAdditionTask(task)) return null
  const { left, right, operation, show } = task.prompt
  const plus = operation === '+'
  const said = additionPlugin.speak(task)
  if (show === 'words') {
    return (
      <p className="addition-words" aria-label={said}>
        {numberWords(left)} {plus ? 'плюс' : 'минус'} {numberWords(right)} — сколько?
      </p>
    )
  }
  if (show === 'picture') {
    return (
      <p className="addition-picture" aria-label={said}>
        {plus ? (
          <>
            <Frames count={left} />
            <span>+</span>
            <Frames count={right} />
          </>
        ) : (
          <Frames count={left} crossed={right} />
        )}
        <span>=</span>
        <span>?</span>
      </p>
    )
  }
  return (
    <p className="addition-prompt" aria-label={said}>
      <span>{left}</span>
      <span>{plus ? '+' : MINUS}</span>
      <span>{right}</span>
      <span>=</span>
      <span>?</span>
    </p>
  )
}

/**
 * Counters in ten-frames, two rows of five to a frame; the last `crossed` of
 * them struck out, which is how taking away is drawn.
 */
function Frames({ count, crossed = 0 }: { readonly count: number; readonly crossed?: number }) {
  const frames = Math.max(1, Math.ceil(count / (2 * FRAME)))
  const width = frames * (FRAME * CELL + CELL / 2)
  const height = 2 * CELL
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
    >
      {Array.from({ length: frames * 2 * FRAME }, (_, i) => {
        const frame = Math.floor(i / (2 * FRAME))
        const inFrame = i % (2 * FRAME)
        const x = frame * (FRAME * CELL + CELL / 2) + (inFrame % FRAME) * CELL
        const y = Math.floor(inFrame / FRAME) * CELL
        const struck = i >= count - crossed && i < count
        return (
          <g key={i}>
            <rect x={x} y={y} width={CELL} height={CELL} fill="#fffdf7" stroke="#8a7f6a" />
            {i < count && (
              <circle
                cx={x + CELL / 2}
                cy={y + CELL / 2}
                r={CELL / 2 - 4}
                fill={struck ? '#c9c2b3' : '#e8833a'}
              />
            )}
            {struck && (
              <path
                d={`M ${String(x + 5)} ${String(y + 5)} L ${String(x + CELL - 5)} ${String(y + CELL - 5)}`}
                stroke="#b5452b"
                strokeWidth={3}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
