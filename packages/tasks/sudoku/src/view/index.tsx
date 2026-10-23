import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { sudokuPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const sudokuView: TaskView<ReactNode> = {
  pluginId: sudokuPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
