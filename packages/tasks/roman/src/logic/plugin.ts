import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateRoman, PLUGIN_ID, type RomanPrompt } from './generate'
import { romanKnobs, type RomanKnobs } from './knobs'

export const romanPlugin = defineTaskPlugin<RomanKnobs, RomanPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => romanKnobs.parse(raw),
  generate: (knobs, random) => generateRoman(knobs, random),
  speak: () => 'Какое это число?',
})
