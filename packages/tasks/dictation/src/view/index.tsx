import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { dictationPlugin } from '../logic'
import { AnswerView } from './AnswerView'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks, and its board to answer on. */
export const dictationView: TaskView<ReactNode> = {
  pluginId: dictationPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
  // A new task is a new board: the key drops the last task's paint.
  renderAnswer: (task, io) => <AnswerView key={task.itemKey} task={task} io={io} />,
}
