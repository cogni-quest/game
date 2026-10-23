import { defineTaskPlugin } from '@cogni/core'

import { generateMaze, PLUGIN_ID, type MazeAnswer, type MazePrompt } from './generate'
import { mazeKnobs, type MazeKnobs } from './knobs'

export const mazePlugin = defineTaskPlugin<MazeKnobs, MazePrompt, MazeAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => mazeKnobs.parse(raw),
  generate: (knobs, random) => generateMaze(knobs, random),
  speak: ({ prompt }) =>
    prompt.key
      ? 'Какой выход ведёт к сокровищу, если по дороге надо взять ключ?'
      : 'Какой выход ведёт к сокровищу?',
})
