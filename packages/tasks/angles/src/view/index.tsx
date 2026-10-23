import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { anglesPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const anglesView: TaskView<ReactNode> = {
  pluginId: anglesPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
