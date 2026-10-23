import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateTimes, PLUGIN_ID, type TimesPrompt } from './generate'
import { timesKnobs, type TimesKnobs } from './knobs'

const SAID = { '×': 'умножить на', ':': 'разделить на' } as const

export const timesPlugin = defineTaskPlugin<TimesKnobs, TimesPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => timesKnobs.parse(raw),
  generate: (knobs, random) => generateTimes(knobs, random),
  /** «Сколько будет 7 умножить на 3?», «Какое число пропущено: 2, 4, 6, …?» */
  speak: ({ prompt: { kind, tokens } }) => {
    if (kind === 'skip') {
      const row = tokens.filter((t) => t !== ',').map((t) => (t === 'blank' ? '…' : String(t)))
      return `Какое число пропущено: ${row.join(', ')}?`
    }
    const [a, op, b] = tokens
    return `Сколько будет ${String(a)} ${op === ':' ? SAID[':'] : SAID['×']} ${String(b)}?`
  },
})
