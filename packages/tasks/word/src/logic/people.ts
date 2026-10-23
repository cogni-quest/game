import type { Forms } from '@cogni/core'

/** A child in a story, in the cases the stories need, and the verb ending. */
export interface Person {
  readonly nom: string
  readonly gen: string
  readonly dat: string
  readonly she: boolean
}

export const PEOPLE: readonly Person[] = [
  { nom: 'Маша', gen: 'Маши', dat: 'Маше', she: true },
  { nom: 'Петя', gen: 'Пети', dat: 'Пете', she: false },
  { nom: 'Оля', gen: 'Оли', dat: 'Оле', she: true },
  { nom: 'Миша', gen: 'Миши', dat: 'Мише', she: false },
  { nom: 'Катя', gen: 'Кати', dat: 'Кате', she: true },
  { nom: 'Ваня', gen: 'Вани', dat: 'Ване', she: false },
  { nom: 'Аня', gen: 'Ани', dat: 'Ане', she: true },
  { nom: 'Коля', gen: 'Коли', dat: 'Коле', she: false },
]

/**
 * Things the stories count. All inanimate, so «дали 3 яблока» takes the same
 * form as «3 яблока».
 */
export const THINGS: readonly Forms[] = [
  ['яблоко', 'яблока', 'яблок'],
  ['груша', 'груши', 'груш'],
  ['конфета', 'конфеты', 'конфет'],
  ['марка', 'марки', 'марок'],
  ['шарик', 'шарика', 'шариков'],
  ['карандаш', 'карандаша', 'карандашей'],
  ['наклейка', 'наклейки', 'наклеек'],
  ['кубик', 'кубика', 'кубиков'],
]
