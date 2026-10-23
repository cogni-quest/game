/** A Russian noun as said after one, two and five: яблоко, яблока, яблок. */
export type Forms = readonly [one: string, two: string, five: string]

/** The form a count takes: 1 яблоко, 3 яблока, 11 яблок, 21 яблоко. */
export function plural(count: number, [one, two, five]: Forms): string {
  const ones = count % 10
  const tens = count % 100
  if (ones === 1 && tens !== 11) return one
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return two
  return five
}

/** «3 яблока». */
export function counted(count: number, forms: Forms): string {
  return `${String(count)} ${plural(count, forms)}`
}
