import { counted, defineTaskPlugin } from '@cogni/core'

import { generateLights, PLUGIN_ID, type LightsAnswer, type LightsPrompt } from './generate'
import { lightsKnobs, type LightsKnobs } from './knobs'

export const lightsPlugin = defineTaskPlugin<LightsKnobs, LightsPrompt, LightsAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => lightsKnobs.parse(raw),
  generate: (knobs, random) => generateLights(knobs, random),
  speak: ({ prompt }) => {
    const lights = counted(prompt.shown.length, ['огонёк', 'огонька', 'огоньков'])
    const what = prompt.colours === undefined ? 'порядок' : 'порядок и цвет каждого'
    return prompt.order === 'forward'
      ? `Загорятся ${lights}. Запомни ${what} и нажми их так же.`
      : `Загорятся ${lights}. Запомни ${what} и нажми их наоборот: с последнего до первого.`
  },
})
