import { chance, choiceAnswer, pick, type ChoiceAnswer, type Random, type Task } from '@cogni/core'

import type { FactsKnobs } from './knobs'

/** A child in a fact, in the two cases a fact needs: «Маша выше Пети». */
export interface Person {
  readonly nom: string
  readonly gen: string
}

export const PEOPLE: readonly Person[] = [
  { nom: 'Маша', gen: 'Маши' },
  { nom: 'Петя', gen: 'Пети' },
  { nom: 'Оля', gen: 'Оли' },
  { nom: 'Миша', gen: 'Миши' },
  { nom: 'Катя', gen: 'Кати' },
  { nom: 'Ваня', gen: 'Вани' },
  { nom: 'Аня', gen: 'Ани' },
  { nom: 'Коля', gen: 'Коли' },
]

export type Relation = 'tall' | 'old' | 'heavy' | 'fast'

/** The word for «more» and the word for «less» of each comparison. */
export const WORDS: Record<Relation, { readonly more: string; readonly less: string }> = {
  tall: { more: 'выше', less: 'ниже' },
  old: { more: 'старше', less: 'младше' },
  heavy: { more: 'тяжелее', less: 'легче' },
  fast: { more: 'быстрее', less: 'медленнее' },
}

const RELATIONS = Object.keys(WORDS) as Relation[]

/** «left more right» or «left less right», as said. */
export interface Fact {
  readonly left: string
  readonly word: 'more' | 'less'
  readonly right: string
}

export interface FactsPrompt {
  readonly relation: Relation
  readonly facts: readonly Fact[]
  /** Who is the most — «выше всех» — or the least. */
  readonly ask: 'more' | 'less'
  readonly text: string
}

export type FactsTask = Task<FactsPrompt, ChoiceAnswer>

export const PLUGIN_ID = 'facts'

export function isFactsTask(task: Task): task is FactsTask {
  return task.pluginId === PLUGIN_ID
}

export function generateFacts({ people }: FactsKnobs, random: Random): FactsTask {
  const relation = pick(random, RELATIONS)
  const words = WORDS[relation]
  // Drawn in rank order, the first the most; the buttons keep the list's order.
  const ranked: Person[] = []
  while (ranked.length < people) {
    const person = pick(random, PEOPLE)
    if (!ranked.includes(person)) ranked.push(person)
  }
  const rank = (p: Person) => ranked.indexOf(p)

  // Each neighbouring pair is one fact, said with either word.
  const pairs = ranked.slice(1).map((lower, i) => [ranked[i] ?? lower, lower] as const)
  const said = pairs.map(([higher, lower]) => {
    const flip = chance(random, 0.5)
    const fact: Fact = flip
      ? { left: lower.nom, word: 'less', right: higher.nom }
      : { left: higher.nom, word: 'more', right: lower.nom }
    const code = flip
      ? `${String(rank(lower))}<${String(rank(higher))}`
      : `${String(rank(higher))}>${String(rank(lower))}`
    const text = flip
      ? `${lower.nom} ${words.less} ${higher.gen}.`
      : `${higher.nom} ${words.more} ${lower.gen}.`
    return { fact, code, text }
  })
  if (said.length > 1 && chance(random, 0.5)) said.reverse()

  const ask = chance(random, 0.5) ? 'more' : 'less'
  const question = people === 2 ? `Кто ${words[ask]}?` : `Кто ${words[ask]} всех?`
  const answer = (ask === 'more' ? ranked[0] : ranked[ranked.length - 1]) ?? ranked[0]
  const options = PEOPLE.filter((p) => ranked.includes(p)).map((p) => ({
    value: p.nom,
    label: p.nom,
  }))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `facts:${relation}:${said.map((s) => s.code).join(',')}?${ask}`,
    prompt: {
      relation,
      facts: said.map((s) => s.fact),
      ask,
      text: `${said.map((s) => s.text).join(' ')} ${question}`,
    },
    answer: choiceAnswer(answer?.nom ?? '', options),
  }
}
