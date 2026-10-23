import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { sequencePlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const sequenceView: TaskView<ReactNode> = {
  pluginId: sequencePlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
