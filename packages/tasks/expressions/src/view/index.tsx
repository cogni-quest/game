import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { expressionsPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const expressionsView: TaskView<ReactNode> = {
  pluginId: expressionsPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
