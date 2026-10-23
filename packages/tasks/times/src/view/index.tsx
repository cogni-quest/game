import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { timesPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const timesView: TaskView<ReactNode> = {
  pluginId: timesPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
