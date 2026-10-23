import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { mazePlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const mazeView: TaskView<ReactNode> = {
  pluginId: mazePlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
