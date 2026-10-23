import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import { generateOddOneOut, PLUGIN_ID, type OddOneOutPrompt, type Place } from './generate'
import { oddOneOutKnobs, type OddOneOutKnobs } from './knobs'

export const oddOneOutPlugin = defineTaskPlugin<
  OddOneOutKnobs,
  OddOneOutPrompt,
  ChoiceAnswer<Place>
>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => oddOneOutKnobs.parse(raw),
  generate: (knobs, random) => generateOddOneOut(knobs, random),
  speak: () => 'Что здесь лишнее?',
})
