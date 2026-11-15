import type { Task } from '@cogni/core'

import { isDictationTask, type Direction } from '../logic'

const ARROWS: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  'up-right': '↗',
  'up-left': '↖',
  'down-right': '↘',
  'down-left': '↙',
}

/** The footprints of the board's marked cell, small, for the ends of the row. */
function Footprints() {
  return (
    <svg viewBox="12 10 32 36" width="80%" height="80%" aria-hidden="true">
      <ellipse cx={21} cy={33} rx={6.5} ry={10} transform="rotate(-12 21 33)" fill="currentColor" />
      <ellipse cx={36} cy={22} rx={6.5} ry={10} transform="rotate(12 36 22)" fill="currentColor" />
    </svg>
  )
}

/**
 * The dictation as the child sees it: one arrow per cell, no numbers — «2 →»
 * is drawn «→ →», so every arrow is one press on the board. The arrows of one
 * step sit closer together, and a wider gap marks each turn.
 *
 * The row reads as a route with two ends: the footprints of the board at one,
 * «?» at the other. When the end is asked, the footprints come first; when
 * the start is asked, the arrows lead *into* the footprints — they are where
 * the thief stopped, and the arrows are walked back from the last one.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isDictationTask(task)) return null
  const { moves, ask } = task.prompt
  const cells = moves.reduce((sum, m) => sum + m.count, 0)
  const footprints = (
    <li className="dictation-step dictation-end" aria-label="следы">
      <span className="dictation-arrow dictation-mark is-footprints">
        <Footprints />
      </span>
    </li>
  )
  const unknown = (
    <li className="dictation-step dictation-end" aria-label="неизвестно">
      <span className="dictation-arrow dictation-mark is-unknown">?</span>
    </li>
  )
  return (
    <figure className="dictation-prompt">
      <figcaption>
        {ask === 'end' ? 'Где спрятался воришка?' : 'Откуда прибежал воришка?'}
      </figcaption>
      {ask === 'start' && (
        <p className="dictation-hint">Стрелки ведут к следам — пройди их назад, с последней</p>
      )}
      <ol className="dictation-moves" aria-label={`${String(cells)} клеток`}>
        {ask === 'end' ? footprints : unknown}
        {moves.map((move, i) => (
          <li key={i} className="dictation-step">
            {Array.from({ length: move.count }, (_, k) => (
              <span key={k} className="dictation-arrow">
                {ARROWS[move.direction]}
              </span>
            ))}
          </li>
        ))}
        {ask === 'end' ? unknown : footprints}
      </ol>
    </figure>
  )
}
