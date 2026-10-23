import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { comparingPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const comparingView: TaskView<ReactNode> = {
  pluginId: comparingPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
