import { defineTaskPlugin } from '@cogni/core'

import {
  generateBonds,
  PLUGIN_ID,
  type BondsAnswer,
  type BondsPrompt,
  type Token,
} from './generate'
import { bondsKnobs, type BondsKnobs } from './knobs'

const SAID: Record<Exclude<Token, number>, string> = {
  blank: 'сколько',
  '+': 'плюс',
  '−': 'минус',
  '=': 'равно',
  tens: 'десятков',
  hundreds: 'сотен',
}

export const bondsPlugin = defineTaskPlugin<BondsKnobs, BondsPrompt, BondsAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => bondsKnobs.parse(raw),
  generate: (knobs, random) => generateBonds(knobs, random),
  speak: ({ prompt }) => {
    if (prompt.show === 'pairs') return `Какие пары дают ${String(prompt.whole)}? Нажми все.`
    if (prompt.show === 'house') {
      const known = prompt.parts.find((room) => room !== 'blank') ?? 0
      return `${String(prompt.whole)} — это ${String(known)} и сколько?`
    }
    const words = prompt.tokens.map((t) => (typeof t === 'number' ? String(t) : SAID[t]))
    return `${words.join(' ')}?`
  },
})
