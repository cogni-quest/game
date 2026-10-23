import { defineTaskPlugin, numberWords, type NumberAnswer } from '@cogni/core'

import { generateAddition, PLUGIN_ID, type AdditionPrompt } from './generate'
import { additionKnobs, type AdditionKnobs } from './knobs'

/**
 * Weights are ignored for now: every shape is built to its rule directly, and
 * leaning towards particular examples would need them enumerated first. The
 * contract allows a plugin to ignore them.
 */
export const additionPlugin = defineTaskPlugin<AdditionKnobs, AdditionPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => additionKnobs.parse(raw),
  generate: (knobs, random) => generateAddition(knobs, random),
  speak: ({ prompt }) =>
    `${numberWords(prompt.left)} ${prompt.operation === '+' ? 'плюс' : 'минус'} ${numberWords(prompt.right)}`,
})
