import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { columnPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const columnView: TaskView<ReactNode> = {
  pluginId: columnPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
