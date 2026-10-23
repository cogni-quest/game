import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateAngles, PLUGIN_ID, type AnglesPrompt, type Answer } from './generate'
import { anglesKnobs, type AnglesKnobs } from './knobs'

export const anglesPlugin = defineTaskPlugin<AnglesKnobs, AnglesPrompt, ChoiceAnswer<Answer>>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => anglesKnobs.parse(raw),
  generate: (knobs, random) => generateAngles(knobs, random),
  speak: ({ prompt }) => (prompt.ask === 'is-right' ? 'Это прямой угол?' : 'Какой угол прямой?'),
})
