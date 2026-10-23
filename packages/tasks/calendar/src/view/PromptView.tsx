import type { Task } from '@cogni/core'

import { calendarPlugin, isCalendarTask } from '../logic'

/** The question as text; the game also reads it aloud. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isCalendarTask(task)) return null
  return <p className="calendar-prompt">{calendarPlugin.speak(task)}</p>
}
