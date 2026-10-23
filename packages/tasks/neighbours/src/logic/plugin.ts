import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateNeighbours, PLUGIN_ID, type NeighboursPrompt } from './generate'
import { neighboursKnobs, type NeighboursKnobs } from './knobs'

export const neighboursPlugin = defineTaskPlugin<NeighboursKnobs, NeighboursPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => neighboursKnobs.parse(raw),
  generate: (knobs, random) => generateNeighbours(knobs, random),
  speak: ({ prompt, answer }) => {
    const n = answer.expected
    switch (prompt.ask) {
      case 'next':
        return `Какое число идёт после ${String(n - 1)}?`
      case 'previous':
        return `Какое число стоит перед ${String(n + 1)}?`
      case 'between':
        return `Какое число между ${String(n - 1)} и ${String(n + 1)}?`
      case 'skip-next':
        return `Какое число стоит через одно после ${String(n - 2)}?`
      case 'skip-previous':
        return `Какое число стоит через одно перед ${String(n + 2)}?`
    }
  },
})
