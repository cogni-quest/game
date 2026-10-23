import { counted, type Forms } from '@cogni/core'

import type { PairId } from './knobs'

export interface Unit {
  /** As written in the textbook: «дм». */
  readonly short: string
  /** Said after one, two and five: дециметр, дециметра, дециметров. */
  readonly names: Forms
}

export interface Pair {
  readonly big: Unit
  readonly small: Unit
  /** How many of the small unit make one of the big. */
  readonly ratio: number
}

const unit = (short: string, ...names: Forms): Unit => ({ short, names })

const MM = unit('мм', 'миллиметр', 'миллиметра', 'миллиметров')
const CM = unit('см', 'сантиметр', 'сантиметра', 'сантиметров')
const DM = unit('дм', 'дециметр', 'дециметра', 'дециметров')
const M = unit('м', 'метр', 'метра', 'метров')
const ROUBLE = unit('р.', 'рубль', 'рубля', 'рублей')
const KOPECK = unit('к.', 'копейка', 'копейки', 'копеек')
const HOUR = unit('ч', 'час', 'часа', 'часов')
const MINUTE = unit('мин', 'минута', 'минуты', 'минут')
const DAY = unit('сут.', 'сутки', 'суток', 'суток')
const YEAR = unit('г.', 'год', 'года', 'лет')
const MONTH = unit('мес.', 'месяц', 'месяца', 'месяцев')
const KG = unit('кг', 'килограмм', 'килограмма', 'килограммов')
const GRAM = unit('г', 'грамм', 'грамма', 'граммов')
const CM2 = unit('см²', 'квадратный сантиметр', 'квадратных сантиметра', 'квадратных сантиметров')
const DM2 = unit('дм²', 'квадратный дециметр', 'квадратных дециметра', 'квадратных дециметров')
const M2 = unit('м²', 'квадратный метр', 'квадратных метра', 'квадратных метров')

/** Every pair of units the plugin converts. A new measure is one line here. */
export const PAIRS: Record<PairId, Pair> = {
  'dm-cm': { big: DM, small: CM, ratio: 10 },
  'm-dm': { big: M, small: DM, ratio: 10 },
  'm-cm': { big: M, small: CM, ratio: 100 },
  'cm-mm': { big: CM, small: MM, ratio: 10 },
  'rub-kop': { big: ROUBLE, small: KOPECK, ratio: 100 },
  'h-min': { big: HOUR, small: MINUTE, ratio: 60 },
  'day-h': { big: DAY, small: HOUR, ratio: 24 },
  'year-month': { big: YEAR, small: MONTH, ratio: 12 },
  'kg-g': { big: KG, small: GRAM, ratio: 1000 },
  'dm2-cm2': { big: DM2, small: CM2, ratio: 100 },
  'm2-dm2': { big: M2, small: DM2, ratio: 100 },
}

/** «3 сантиметра», «11 сантиметров», «21 сантиметр». */
export function named(count: number, { names }: Unit): string {
  return counted(count, names)
}
