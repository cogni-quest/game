import { defineTaskPlugin } from '@cogni/core'

import {
  generateDictation,
  PLUGIN_ID,
  type DictationAnswer,
  type DictationPrompt,
  type Direction,
  type Move,
} from './generate'
import { dictationKnobs, type DictationKnobs } from './knobs'

/** How many cells, as the teacher says it after «на»: steps are four cells at most. */
const CELLS: Record<number, string> = {
  1: 'одну клетку',
  2: 'две клетки',
  3: 'три клетки',
  4: 'четыре клетки',
}

const WAYS: Record<Direction, string> = {
  up: 'вверх',
  down: 'вниз',
  left: 'влево',
  right: 'вправо',
  'up-right': 'по диагонали вверх-вправо',
  'up-left': 'по диагонали вверх-влево',
  'down-right': 'по диагонали вниз-вправо',
  'down-left': 'по диагонали вниз-влево',
}

/** «две клетки вправо». */
export function sayMove({ direction, count }: Move): string {
  return `${CELLS[count] ?? String(count)} ${WAYS[direction]}`
}

export const dictationPlugin = defineTaskPlugin<DictationKnobs, DictationPrompt, DictationAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => dictationKnobs.parse(raw),
  generate: (knobs, random) => generateDictation(knobs, random),
  speak: ({ prompt }) => {
    const steps = prompt.moves.map(sayMove).join(', ')
    return prompt.ask === 'end'
      ? `Воришка выбежал из отмеченной клетки: ${steps}. Где он спрятался?`
      : `Воришка прибежал в отмеченную клетку так: ${steps}. Откуда он прибежал?`
  },
})
