const ONES = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const TEENS = [
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
]
const TENS = [
  '',
  '',
  'двадцать',
  'тридцать',
  'сорок',
  'пятьдесят',
  'шестьдесят',
  'семьдесят',
  'восемьдесят',
  'девяносто',
]
const HUNDREDS = [
  '',
  'сто',
  'двести',
  'триста',
  'четыреста',
  'пятьсот',
  'шестьсот',
  'семьсот',
  'восемьсот',
  'девятьсот',
]

export const MAX_WORDS = 1000

/** A whole number from 0 to 1000 in words, as counted aloud: «триста сорок семь». */
export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_WORDS) {
    throw new RangeError(`Only whole numbers from 0 to ${String(MAX_WORDS)}: ${String(n)}`)
  }
  if (n === MAX_WORDS) return 'тысяча'
  if (n === 0) return ONES[0] ?? ''
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const tens = Math.floor(rest / 10)
  const ones = rest % 10
  const words = [
    HUNDREDS[hundreds] ?? '',
    tens === 1 ? (TEENS[ones] ?? '') : (TENS[tens] ?? ''),
    tens === 1 || ones === 0 ? '' : (ONES[ones] ?? ''),
  ]
  return words.filter((w) => w !== '').join(' ')
}
