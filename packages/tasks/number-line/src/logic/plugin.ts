import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateNumberLine, PLUGIN_ID, type NumberLinePrompt } from './generate'
import { numberLineKnobs, type NumberLineKnobs } from './knobs'

export const numberLinePlugin = defineTaskPlugin<NumberLineKnobs, NumberLinePrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => numberLineKnobs.parse(raw),
  generate: (knobs, random) => generateNumberLine(knobs, random),
  speak: () => 'Какое число отмечено стрелкой?',
})
