import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { clockPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const clockView: TaskView<ReactNode> = {
  pluginId: clockPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
