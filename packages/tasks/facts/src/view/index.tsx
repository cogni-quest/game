import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { factsPlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const factsView: TaskView<ReactNode> = {
  pluginId: factsPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
