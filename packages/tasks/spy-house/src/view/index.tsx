import type { Task, TaskView } from '@cogni/core'
import type { ReactNode } from 'react'

import { spyHousePlugin } from '../logic'
import { AnswerView } from './AnswerView'
import { PromptView } from './PromptView'

/**
 * A key per task object, not per item key: the next house must get a fresh
 * form, never the last one's picked window — even if it repeats a house.
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

/** What a game registers to draw this plugin's tasks, and the house to answer on. */
export const spyHouseView: TaskView<ReactNode> = {
  pluginId: spyHousePlugin.id,
  renderPrompt: (task) => <PromptView task={task} />,
  renderAnswer: (task, io) => <AnswerView key={keyOf(task)} task={task} io={io} />,
}
