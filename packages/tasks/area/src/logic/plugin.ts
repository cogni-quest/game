import { defineTaskPlugin } from '@cogni/core'

import { generateArea, PLUGIN_ID, type AreaAnswer, type AreaPrompt } from './generate'
import { areaKnobs, type AreaKnobs } from './knobs'

export const areaPlugin = defineTaskPlugin<AreaKnobs, AreaPrompt, AreaAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => areaKnobs.parse(raw),
  generate: (knobs, random) => generateArea(knobs, random),
  speak: ({ prompt }) => {
    switch (prompt.ask) {
      case 'compare':
        return 'Какая фигура больше по площади?'
      case 'cells':
        return 'Сколько клеточек занимает фигура? Это её площадь в квадратных сантиметрах.'
      case 'sides':
        return 'Чему равна площадь прямоугольника в квадратных сантиметрах?'
    }
  },
})
