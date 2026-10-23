import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateFacts, PLUGIN_ID, type FactsPrompt } from './generate'
import { factsKnobs, type FactsKnobs } from './knobs'

export const factsPlugin = defineTaskPlugin<FactsKnobs, FactsPrompt, ChoiceAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => factsKnobs.parse(raw),
  generate: (knobs, random) => generateFacts(knobs, random),
  speak: ({ prompt }) => prompt.text,
})
