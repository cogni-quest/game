import type { TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { lengthComparePlugin } from '../logic'
import { PromptView } from './PromptView'

/** What a game registers to draw this plugin's tasks. */
export const lengthCompareView: TaskView<ReactNode> = {
  pluginId: lengthComparePlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
}
