import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { unitsPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const unitsView: TaskView<ReactNode> = {
  pluginId: unitsPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
