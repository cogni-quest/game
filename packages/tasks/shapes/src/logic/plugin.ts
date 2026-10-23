import { defineTaskPlugin } from '@cogni/core'

import { generateShapes, PLUGIN_ID, type ShapesAnswer, type ShapesPrompt } from './generate'
import { shapesKnobs, type ShapesKnobs, type Target } from './knobs'

/** «Сколько …?» takes the genitive plural. */
const MANY: Record<Target, string> = {
  triangle: 'треугольников',
  square: 'квадратов',
  circle: 'кругов',
  quadrilateral: 'четырёхугольников',
}

/** «Найди все …» takes the accusative plural. */
const ALL: Record<Target, string> = {
  triangle: 'треугольники',
  square: 'квадраты',
  circle: 'круги',
  quadrilateral: 'четырёхугольники',
}

export const shapesPlugin = defineTaskPlugin<ShapesKnobs, ShapesPrompt, ShapesAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => shapesKnobs.parse(raw),
  generate: (knobs, random) => generateShapes(knobs, random),
  speak: ({ prompt }) => {
    switch (prompt.ask) {
      case 'name':
        return 'Как называется эта фигура?'
      case 'count':
        return `Сколько ${MANY[prompt.target]}?`
      case 'find':
        return `Найди все ${ALL[prompt.target]}.`
    }
  },
})
