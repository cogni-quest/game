import { defineTaskPlugin, type PickAnswer } from '@cogni/core'

import { figureWords, generateSort, PLUGIN_ID, type SortPrompt } from './generate'
import { sortKnobs, type SortKnobs } from './knobs'

export const sortPlugin = defineTaskPlugin<SortKnobs, SortPrompt, PickAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => sortKnobs.parse(raw),
  generate: (knobs, random) => generateSort(knobs, random),
  speak: ({ prompt }) =>
    prompt.by === 'category'
      ? `Выбери все ${prompt.asked}.`
      : `Выбери все ${figureWords(prompt.asked)}.`,
})
