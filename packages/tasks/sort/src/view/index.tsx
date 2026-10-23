import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { sortPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const sortView: TaskView<ReactNode> = {
  pluginId: sortPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
