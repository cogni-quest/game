import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { romanPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const romanView: TaskView<ReactNode> = {
  pluginId: romanPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
