import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateMissing, PLUGIN_ID, type MissingPrompt, type Token } from './generate'
import { missingKnobs, type MissingKnobs } from './knobs'

const SAID: Record<Exclude<Token, number>, string> = {
  blank: 'сколько',
  '+': 'плюс',
  '−': 'минус',
  '×': 'умножить на',
  '=': 'равно',
}

export const missingPlugin = defineTaskPlugin<MissingKnobs, MissingPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => missingKnobs.parse(raw),
  generate: (knobs, random) => generateMissing(knobs, random),
  /** «3 плюс сколько равно 5?» */
  speak: ({ prompt }) =>
    `${prompt.tokens.map((t) => (typeof t === 'number' ? String(t) : SAID[t])).join(' ')}?`,
})
