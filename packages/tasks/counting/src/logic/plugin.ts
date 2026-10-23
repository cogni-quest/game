import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateCounting, PLUGIN_ID, type CountingPrompt } from './generate'
import { countingKnobs, type CountingKnobs } from './knobs'

export const countingPlugin = defineTaskPlugin<CountingKnobs, CountingPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => countingKnobs.parse(raw),
  generate: (knobs, random) => generateCounting(knobs, random),
  speak: ({ prompt }) => (prompt.ask === 'red' ? 'Сколько красных кружков?' : 'Сколько кружков?'),
})
