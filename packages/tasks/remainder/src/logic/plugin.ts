import { counted, defineTaskPlugin, type Forms, type NumberAnswer } from '@cogni/core'

import { generateRemainder, PLUGIN_ID, type RemainderPrompt } from './generate'
import { remainderKnobs, type RemainderKnobs } from './knobs'

/** «разложили 3 конфеты, 17 конфет, 1 конфету» — what is laid out takes the accusative. */
const CANDIES: Forms = ['конфету', 'конфеты', 'конфет']

export const remainderPlugin = defineTaskPlugin<RemainderKnobs, RemainderPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => remainderKnobs.parse(raw),
  generate: (knobs, random) => generateRemainder(knobs, random),
  speak: ({ prompt: { show, ask, dividend, divisor } }) => {
    if (show === 'picture') {
      const question = ask === 'quotient' ? 'Сколько полных кучек?' : 'Сколько конфет осталось?'
      return `${counted(dividend, CANDIES)} разложили по ${String(divisor)}. ${question}`
    }
    const question = ask === 'quotient' ? 'Сколько получится?' : 'Какой остаток?'
    return `${String(dividend)} разделить на ${String(divisor)} с остатком. ${question}`
  },
})
