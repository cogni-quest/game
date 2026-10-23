import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { perimeterPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const perimeterView: TaskView<ReactNode> = {
  pluginId: perimeterPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
