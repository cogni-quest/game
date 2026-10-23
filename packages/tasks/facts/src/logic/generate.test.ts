import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateFacts, type FactsPrompt } from './generate'
import type { FactsKnobs } from './knobs'
import { factsPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: FactsKnobs) {
  const random = createRandom(31)
  return Array.from({ length: SAMPLES }, () => generateFacts(knobs, random))
}

/** Who the facts make the most or the least, worked out from the facts alone. */
function solve({ facts, ask }: FactsPrompt): string | undefined {
  // Every fact as «above → below».
  const above = facts.map((f) => (f.word === 'more' ? [f.left, f.right] : [f.right, f.left]))
  const names = [...new Set(above.flat())]
  const top = names.filter((n) => !above.some(([, below]) => below === n))
  const bottom = names.filter((n) => !above.some(([up]) => up === n))
  const found = ask === 'more' ? top : bottom
  return found.length === 1 ? found[0] : undefined
}

describe('generateFacts', () => {
  it.each<FactsKnobs>([{ people: 2 }, { people: 3 }])(
    '$people people: the facts alone give the answer',
    (knobs) => {
      const wrong = sample(knobs).filter((t) => {
        const names = new Set(t.prompt.facts.flatMap((f) => [f.left, f.right]))
        return (
          t.prompt.facts.length !== knobs.people - 1 ||
          names.size !== knobs.people ||
          solve(t.prompt) !== t.answer.expected
        )
      })
      expect(wrong).toEqual([])
    },
  )

  it('offers every child once, the answer among them', () => {
    const wrong = sample({ people: 3 }).filter(({ prompt, answer }) => {
      const values = answer.options.map((o) => o.value)
      const names = new Set(prompt.facts.flatMap((f) => [f.left, f.right]))
      return (
        new Set(values).size !== values.length ||
        values.length !== names.size ||
        !values.every((v) => names.has(v))
      )
    })
    expect(wrong).toEqual([])
  })

  it('says facts both ways and asks both ways', () => {
    const tasks = sample({ people: 3 })
    expect(new Set(tasks.flatMap((t) => t.prompt.facts.map((f) => f.word)))).toEqual(
      new Set(['more', 'less']),
    )
    expect(new Set(tasks.map((t) => t.prompt.ask))).toEqual(new Set(['more', 'less']))
  })

  it('does not always put the answer first among the buttons', () => {
    const firsts = new Set(
      sample({ people: 3 }).map((t) => t.answer.options[0]?.value === t.answer.expected),
    )
    expect(firsts).toEqual(new Set([true, false]))
  })

  it('reads well', () => {
    const task = generateFacts({ people: 3 }, createRandom(2))
    expect(factsPlugin.speak(task)).toMatch(
      /^[А-Я][а-я]+ [а-я]+ [А-Я][а-я]+\. [А-Я][а-я]+ [а-я]+ [А-Я][а-я]+\. Кто [а-я]+ всех\?$/,
    )
  })
})

describe('factsPlugin', () => {
  it.each([{ people: 4 }, {}, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => factsPlugin.generate(knobs, createRandom(1))).toThrow(/facts/)
  })
})
