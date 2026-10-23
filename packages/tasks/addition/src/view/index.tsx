import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { additionPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const additionView: TaskView<ReactNode> = {
  pluginId: additionPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
