import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { neighboursPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const neighboursView: TaskView<ReactNode> = {
  pluginId: neighboursPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
