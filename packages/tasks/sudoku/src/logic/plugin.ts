import { defineTaskPlugin, type NumberAnswer } from '@cogni/core'

import { generateSudoku, MAGIC_SUM, PLUGIN_ID, type SudokuPrompt } from './generate'
import { sudokuKnobs, type SudokuKnobs } from './knobs'

const QUESTION = 'Какое число должно стоять в клетке со знаком вопроса?'

export const sudokuPlugin = defineTaskPlugin<SudokuKnobs, SudokuPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => sudokuKnobs.parse(raw),
  generate: (knobs, random) => generateSudoku(knobs, random),
  speak: ({ prompt }) =>
    prompt.kind === 'magic'
      ? `В каждой строке, столбце и диагонали сумма ${String(MAGIC_SUM)}. ${QUESTION}`
      : QUESTION,
})
