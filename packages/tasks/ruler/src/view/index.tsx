import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { rulerPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const rulerView: TaskView<ReactNode> = {
  pluginId: rulerPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
