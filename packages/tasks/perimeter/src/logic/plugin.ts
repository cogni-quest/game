import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generatePerimeter, PLUGIN_ID, type PerimeterPrompt } from './generate'
import { perimeterKnobs, type PerimeterKnobs } from './knobs'

export const perimeterPlugin = defineTaskPlugin<PerimeterKnobs, PerimeterPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => perimeterKnobs.parse(raw),
  generate: (knobs, random) => generatePerimeter(knobs, random),
  speak: ({ prompt }) =>
    prompt.figure === 'broken-line' ? 'Какая длина у ломаной?' : 'Чему равен периметр?',
})
