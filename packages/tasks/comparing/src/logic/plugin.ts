import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateComparing, PLUGIN_ID, type ComparingPrompt, type Relation } from './generate'
import { comparingKnobs, type ComparingKnobs } from './knobs'

export const comparingPlugin = defineTaskPlugin<
  ComparingKnobs,
  ComparingPrompt,
  ChoiceAnswer<Relation>
>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => comparingKnobs.parse(raw),
  generate: (knobs, random) => generateComparing(knobs, random),
  speak: ({ prompt }) => {
    switch (prompt.show) {
      case 'number':
        return `Сравни: ${String(prompt.left)} и ${String(prompt.right)}`
      case 'picture':
        return `Сравни: кружки и число ${String(prompt.right)}`
      case 'groups':
        return `Сравни: две группы кружков вместе и число ${String(prompt.right)}`
    }
  },
})
