import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import type { FigureId } from './figures'
import { generatePattern, PLUGIN_ID, type PatternPrompt } from './generate'
import { patternKnobs, type PatternKnobs } from './knobs'

export const patternPlugin = defineTaskPlugin<PatternKnobs, PatternPrompt, ChoiceAnswer<FigureId>>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => patternKnobs.parse(raw),
  generate: (knobs, random) => generatePattern(knobs, random),
  speak: ({ prompt }) =>
    prompt.ask === 'next' ? 'Какая фигура дальше?' : 'Какой фигуры не хватает?',
})
