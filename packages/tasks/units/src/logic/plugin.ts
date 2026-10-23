import { defineTaskPlugin } from '@cogni/core'

import { generateUnits, PLUGIN_ID, type Part, type UnitsAnswer, type UnitsPrompt } from './generate'
import { unitsKnobs, type UnitsKnobs } from './knobs'
import { named, PAIRS, type Pair } from './units'

export const unitsPlugin = defineTaskPlugin<UnitsKnobs, UnitsPrompt, UnitsAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => unitsKnobs.parse(raw),
  generate: (knobs, random) => generateUnits(knobs, random),
  /** «1 дециметр 3 сантиметра — это сколько сантиметров?», «Сравни: 1 метр и 12 дециметров». */
  speak: ({ prompt }) => {
    const pair = PAIRS[prompt.pair]
    const left = prompt.left.map((part) => said(part, pair)).join(' ')
    if (prompt.sign === '□') {
      return `Сравни: ${left} и ${prompt.right.map((part) => said(part, pair)).join(' ')}`
    }
    const right = prompt.right.map((part) => said(part, pair)).join(' и ')
    return `${left} — это ${right}?`
  },
})

function said({ count, unit }: Part, pair: Pair): string {
  const { names } = pair[unit]
  return count === 'blank' ? `сколько ${names[2]}` : named(count, pair[unit])
}
