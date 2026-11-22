import type { Task } from '@cogni/core'

import { isSpyHouseTask, reportSegments } from '../logic'
import { Words } from './Report'

/**
 * The report: one sentence, the landmarks in it drawn as the same pictures the
 * windows hold — easier to read, while left, right and the floors stay words.
 * No marks for the sides anywhere (decided with the parent).
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isSpyHouseTask(task)) return null
  const { clues, windows } = task.prompt
  return (
    <figure className="spy-prompt">
      <figcaption>Донесение</figcaption>
      <p className="spy-report">
        <Words segments={reportSegments(clues, windows)} />
      </p>
    </figure>
  )
}
