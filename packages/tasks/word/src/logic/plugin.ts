import { defineTaskPlugin } from '@cogni/core'

import { generateWord, PLUGIN_ID, type WordAnswer, type WordPrompt } from './generate'
import { wordKnobs, type WordKnobs } from './knobs'

export const wordPlugin = defineTaskPlugin<WordKnobs, WordPrompt, WordAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => wordKnobs.parse(raw),
  generate: (knobs, random) => generateWord(knobs, random),
  speak: ({ prompt }) =>
    prompt.ask === 'plan' ? `${prompt.text} Как решить эту задачу?` : prompt.text,
})
