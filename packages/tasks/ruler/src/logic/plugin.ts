import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateRuler, PLUGIN_ID, type RulerPrompt } from './generate'
import { rulerKnobs, type RulerKnobs } from './knobs'

export const rulerPlugin = defineTaskPlugin<RulerKnobs, RulerPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => rulerKnobs.parse(raw),
  generate: (knobs, random) => generateRuler(knobs, random),
  speak: () => 'Сколько сантиметров длина полоски?',
})
