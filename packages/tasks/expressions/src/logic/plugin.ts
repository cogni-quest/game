import { defineTaskPlugin, type ChoiceAnswer } from '@cogni/core'

import {
  generateExpressions,
  PLUGIN_ID,
  type ExpressionsPrompt,
  type Relation,
  type Side,
} from './generate'
import { expressionsKnobs, type ExpressionsKnobs } from './knobs'

export const expressionsPlugin = defineTaskPlugin<
  ExpressionsKnobs,
  ExpressionsPrompt,
  ChoiceAnswer<Relation>
>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => expressionsKnobs.parse(raw),
  generate: (knobs, random) => generateExpressions(knobs, random),
  /** «Сравни: 7 и 3 плюс 5». */
  speak: ({ prompt }) => `Сравни: ${said(prompt.left)} и ${said(prompt.right)}`,
})

function said(side: Side): string {
  return side.map((t) => (t === '+' ? 'плюс' : t === '−' ? 'минус' : String(t))).join(' ')
}
