import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateClock, PLUGIN_ID, type ClockPrompt } from './generate'
import { clockKnobs, type ClockKnobs } from './knobs'

export const clockPlugin = defineTaskPlugin<ClockKnobs, ClockPrompt, ChoiceAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => clockKnobs.parse(raw),
  generate: (knobs, random) => generateClock(knobs, random),
  speak: () => 'Который час?',
})
