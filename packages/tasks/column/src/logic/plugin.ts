import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateColumn, PLUGIN_ID, type ColumnPrompt } from './generate'
import { columnKnobs, type ColumnKnobs } from './knobs'

export const columnPlugin = defineTaskPlugin<ColumnKnobs, ColumnPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => columnKnobs.parse(raw),
  generate: (knobs, random) => generateColumn(knobs, random),
  speak: ({ prompt: { op, a, b } }) =>
    op === 'add'
      ? `Сложи в столбик: ${String(a)} плюс ${String(b)}.`
      : `Вычти в столбик: ${String(a)} минус ${String(b)}.`,
})
