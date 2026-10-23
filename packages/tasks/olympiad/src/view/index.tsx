import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { olympiadPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const olympiadView: TaskView<ReactNode> = {
  pluginId: olympiadPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
