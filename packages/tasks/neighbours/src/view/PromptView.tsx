import type { Task } from '@cogni/core'

import { isNeighboursTask, neighboursPlugin, type Place } from '../logic'

const GLYPH: Record<Exclude<Place, number>, string> = { blank: '□', skip: '·' }

/** «6, □» — the numbers in a row, with an empty box where the answer goes. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isNeighboursTask(task)) return null
  return (
    <figure className="neighbours-prompt">
      <figcaption>{neighboursPlugin.speak(task)}</figcaption>
      <p aria-label={neighboursPlugin.speak(task)}>
        {task.prompt.shown.map((place, i) =>
          typeof place === 'number' ? (
            <span key={i}>{place}</span>
          ) : (
            <span key={i} className={`neighbours-${place}`}>
              {GLYPH[place]}
            </span>
          ),
        )}
      </p>
    </figure>
  )
}
