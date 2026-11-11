import type { Task, TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { lightsPlugin } from '../logic'
import { AnswerView } from './AnswerView'
import { PromptView } from './PromptView'

/**
 * A key per task object, not per item key: a 3×3 panel has only a few hundred
 * orders, so the next task may well repeat the last one's item key — and must
 * still get a fresh panel, not the last one's presses.
 */
const keys = new WeakMap<Task, number>()
let counter = 0
function keyOf(task: Task): number {
  let key = keys.get(task)
  if (key === undefined) {
    key = ++counter
    keys.set(task, key)
  }
  return key
}

/** What a game registers to draw this plugin's tasks, and its panel to answer on. */
export const lightsView: TaskView<ReactNode> = {
  pluginId: lightsPlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
  renderAnswer: (task, io) => <AnswerView key={keyOf(task)} task={task} io={io} />,
}
