import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateMeasure, PLUGIN_ID, THINGS, type MeasurePrompt } from './generate'
import { measureKnobs, type MeasureKnobs } from './knobs'

export const measurePlugin = defineTaskPlugin<MeasureKnobs, MeasurePrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => measureKnobs.parse(raw),
  generate: (knobs, random) => generateMeasure(knobs, random),
  speak: ({ prompt }) =>
    prompt.quantity === 'mass'
      ? `Сколько килограммов весит ${THINGS[prompt.thing].name}?`
      : 'Сколько литров воды налили?',
})
