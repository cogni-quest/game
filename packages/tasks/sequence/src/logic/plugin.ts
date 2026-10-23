import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateSequence, PLUGIN_ID, type SequencePrompt } from './generate'
import { sequenceKnobs, type SequenceKnobs } from './knobs'

export const sequencePlugin = defineTaskPlugin<SequenceKnobs, SequencePrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => sequenceKnobs.parse(raw),
  generate: (knobs, random) => generateSequence(knobs, random),
  /** «Какое число пропущено: 2, 4, 6, …?» */
  speak: ({ prompt }) =>
    `Какое число пропущено: ${prompt.terms.map((t) => (t === 'blank' ? '…' : String(t))).join(', ')}?`,
})
