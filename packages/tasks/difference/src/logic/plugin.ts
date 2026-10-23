import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateDifference, PLUGIN_ID, type DifferencePrompt } from './generate'
import { differenceKnobs, type DifferenceKnobs } from './knobs'

export const differencePlugin = defineTaskPlugin<DifferenceKnobs, DifferencePrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => differenceKnobs.parse(raw),
  generate: (knobs, random) => generateDifference(knobs, random),
  speak: ({ prompt: { show, red, blue, ask } }) => {
    const redBigger = red > blue
    if (show === 'number') {
      const [big, small] = redBigger ? [red, blue] : [blue, red]
      return ask === 'more'
        ? `На сколько ${String(big)} больше, чем ${String(small)}?`
        : `На сколько ${String(small)} меньше, чем ${String(big)}?`
    }
    const [big, small] = redBigger ? ['красных', 'синих'] : ['синих', 'красных']
    return ask === 'more'
      ? `На сколько ${big} кружков больше, чем ${small}?`
      : `На сколько ${small} кружков меньше, чем ${big}?`
  },
})
