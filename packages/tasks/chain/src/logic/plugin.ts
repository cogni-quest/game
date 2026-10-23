import { defineTaskPlugin } from '@cogni/core'

import type { Token } from './expression'
import { generateChain, PLUGIN_ID, type ChainAnswer, type ChainPrompt } from './generate'
import { chainKnobs, type ChainKnobs } from './knobs'

const SAID: Record<'+' | '−' | '(' | ')', string> = {
  '+': 'плюс',
  '−': 'минус',
  '(': 'скобка открывается',
  ')': 'скобка закрывается',
}

export const chainPlugin = defineTaskPlugin<ChainKnobs, ChainPrompt, ChainAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => chainKnobs.parse(raw),
  generate: (knobs, random) => generateChain(knobs, random),
  speak: ({ prompt }) => {
    if (prompt.ask === 'brackets') {
      const result = prompt.tokens.at(-1)
      return `Где поставить скобки, чтобы получилось ${String(result)}?`
    }
    return `Сколько будет ${said(prompt.tokens)}?`
  },
})

/** «20 минус, скобка открывается, 5 плюс 3, скобка закрывается». */
function said(tokens: readonly Token[]): string {
  let text = ''
  for (const t of tokens) {
    if (t === '=' || t === 'blank') break
    if (t === '(' || t === ')') {
      text = text.trimEnd()
      text += `${text === '' ? '' : ', '}${SAID[t]}, `
    } else {
      text += `${typeof t === 'number' ? String(t) : SAID[t]} `
    }
  }
  return text.trim().replace(/,$/, '')
}
