import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateLengthCompare, PLUGIN_ID, type Answer, type LengthComparePrompt } from './generate'
import { lengthCompareKnobs, type LengthCompareKnobs } from './knobs'

export const lengthComparePlugin = defineTaskPlugin<
  LengthCompareKnobs,
  LengthComparePrompt,
  ChoiceAnswer<Answer>
>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => lengthCompareKnobs.parse(raw),
  generate: (knobs, random) => generateLengthCompare(knobs, random),
  speak: ({ prompt }) =>
    prompt.ask === 'longer' ? 'Какая полоска длиннее?' : 'Какая полоска короче?',
})
