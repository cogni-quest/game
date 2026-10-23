import { counted, defineTaskPlugin, type Forms } from '@cogni/core'

import { generateGroups, PLUGIN_ID, type GroupsAnswer, type GroupsPrompt } from './generate'
import { groupsKnobs, type GroupsKnobs } from './knobs'

const PLATE: Forms = ['тарелка', 'тарелки', 'тарелок']
const CANDY: Forms = ['конфета', 'конфеты', 'конфет']
const ROW: Forms = ['ряд', 'ряда', 'рядов']
const CIRCLE: Forms = ['кружок', 'кружка', 'кружков']

export const groupsPlugin = defineTaskPlugin<GroupsKnobs, GroupsPrompt, GroupsAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => groupsKnobs.parse(raw),
  generate: (knobs, random) => generateGroups(knobs, random),
  speak: ({ prompt }) => {
    switch (prompt.ask) {
      case 'sum':
        return `Сколько будет ${terms(prompt.size, prompt.count)}?`
      case 'product':
        return `${terms(prompt.size, prompt.count)} — это ${String(prompt.size)} умножить на сколько?`
      case 'plates':
        return `${counted(prompt.groups, PLATE)}, на каждой по ${counted(prompt.size, CANDY)}. Сколько всего конфет?`
      case 'array':
        return `${counted(prompt.rows, ROW)} по ${counted(prompt.columns, CIRCLE)}. Сколько всего кружков?`
      case 'commutative': {
        const [a, b] = prompt.left
        const [c, d] = prompt.right
        return `Сравни: ${String(a)} умножить на ${String(b)} и ${String(c)} умножить на ${String(d)}`
      }
      case 'share':
        return `Разложили ${counted(prompt.total, CANDY)} поровну на ${counted(prompt.groups, PLATE)}. Сколько конфет на каждой тарелке?`
      case 'measure-out':
        return `Разложили ${counted(prompt.total, CANDY)} по ${String(prompt.size)} на каждую тарелку. Сколько понадобилось тарелок?`
    }
  },
})

/** «3 плюс 3 плюс 3». */
function terms(size: number, count: number): string {
  return Array.from({ length: count }, () => String(size)).join(' плюс ')
}
