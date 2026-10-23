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

/**
 * The dictation as the child sees it: one arrow per cell, no numbers — «2 →»
 * is drawn «→ →», so every arrow is one press on the board. The arrows of one
 * step sit closer together, and a wider gap marks each turn.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isDictationTask(task)) return null
  const { moves, ask } = task.prompt
  const cells = moves.reduce((sum, m) => sum + m.count, 0)
  return (
    <figure className="dictation-prompt">
      <figcaption>
        {ask === 'end' ? 'Где спрятался воришка?' : 'Откуда прибежал воришка?'}
      </figcaption>
      <ol className="dictation-moves" aria-label={`${String(cells)} клеток`}>
        {moves.map((move, i) => (
          <li key={i} className="dictation-step">
            {Array.from({ length: move.count }, (_, k) => (
              <span key={k} className="dictation-arrow">
                {ARROWS[move.direction]}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </figure>
  )
}
