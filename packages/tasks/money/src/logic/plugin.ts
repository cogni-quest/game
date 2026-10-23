import { counted, defineTaskPlugin } from '@cogni/core'

import { generateMoney, PLUGIN_ID, ROUBLES, type MoneyAnswer, type MoneyPrompt } from './generate'
import { moneyKnobs, type MoneyKnobs } from './knobs'

export const moneyPlugin = defineTaskPlugin<MoneyKnobs, MoneyPrompt, MoneyAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => moneyKnobs.parse(raw),
  generate: (knobs, random) => generateMoney(knobs, random),
  speak: ({ prompt }) => {
    switch (prompt.ask) {
      case 'count':
        return 'Сколько здесь рублей?'
      case 'change':
        return `Купили за ${counted(prompt.price, ROUBLES)}, дали ${counted(prompt.from, ROUBLES)}. Сколько сдачи?`
      case 'make':
        return `Набери ${counted(prompt.target, ROUBLES)}. Нажми нужные монеты.`
    }
  },
})
