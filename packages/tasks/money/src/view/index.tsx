import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { moneyPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const moneyView: TaskView<ReactNode> = {
  pluginId: moneyPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
