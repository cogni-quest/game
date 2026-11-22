import { defineTaskPlugin } from '@cogni/core'

import { generateSpyHouse, PLUGIN_ID, type SpyHouseAnswer, type SpyHousePrompt } from './generate'
import { spyHouseKnobs, type SpyHouseKnobs } from './knobs'
import { reportSegments, spoken } from './words'

export const spyHousePlugin = defineTaskPlugin<SpyHouseKnobs, SpyHousePrompt, SpyHouseAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => spyHouseKnobs.parse(raw),
  generate: (knobs, random) => generateSpyHouse(knobs, random),
  speak: ({ prompt }) => `${spoken(reportSegments(prompt.clues, prompt.windows))} Найди его окно.`,
})
