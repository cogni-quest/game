import { counted, defineTaskPlugin, plural, type NumberAnswer } from '@cogni/core'

import { generateOlympiad, PLUGIN_ID, type OlympiadPrompt, type Pan } from './generate'
import { olympiadKnobs, type OlympiadKnobs } from './knobs'
import { thing } from './things'

/** «Сколько треугольников…»: the asked kind after «сколько». */
const MANY = {
  triangle: 'треугольников',
  rectangle: 'прямоугольников',
  square: 'квадратов',
  circle: 'кругов',
} as const

/** «1 арбуз весит», «3 дыни весят». */
function weighs({ thing: id, count }: Pan): string {
  const { names } = thing(id)
  const verb = plural(count, names) === names[0] ? 'весит' : 'весят'
  return `${counted(count, names)} ${verb}`
}

export const olympiadPlugin = defineTaskPlugin<OlympiadKnobs, OlympiadPrompt, NumberAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => olympiadKnobs.parse(raw),
  generate: (knobs, random) => generateOlympiad(knobs, random),
  speak: ({ prompt }) => {
    if (prompt.ask === 'figures') return `Сколько ${MANY[prompt.target]} на рисунке?`
    const facts = prompt.scales.map(
      ({ left, right }) =>
        `${weighs(left)} столько же, сколько ${counted(right.count, thing(right.thing).names)}.`,
    )
    const many = thing(prompt.of).names[2]
    const against = counted(prompt.against.count, thing(prompt.against.thing).names)
    return `${facts.join(' ')} Сколько ${many} весят столько же, сколько ${against}?`
  },
})
