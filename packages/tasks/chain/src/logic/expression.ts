export type Op = '+' | '−'

/** A pair of brackets around the terms from `[0]` to `[1]`, both included. */
export type Span = readonly [number, number]

/** A number, a sign, a bracket, or the empty box for the answer. */
export type Token = number | Op | '(' | ')' | '=' | 'blank'

const apply = (a: number, op: Op, b: number) => (op === '+' ? a + b : a - b)

/**
 * Works the expression out the way a child does: what is in brackets first,
 * then left to right. Every value along the way is listed, the last one is the
 * result.
 */
export function steps(
  numbers: readonly number[],
  ops: readonly Op[],
  spans: readonly Span[],
): number[] {
  const done: number[] = []
  // Each bracket collapses into one term.
  const terms: number[] = []
  const between: Op[] = []
  for (let i = 0; i < numbers.length; i++) {
    const span = spans.find(([from]) => from === i)
    const to = span?.[1] ?? i
    let value = numbers[i] ?? 0
    for (let j = i + 1; j <= to; j++) {
      value = apply(value, ops[j - 1] ?? '+', numbers[j] ?? 0)
      done.push(value)
    }
    terms.push(value)
    if (to + 1 < numbers.length) between.push(ops[to] ?? '+')
    i = to
  }
  let value = terms[0] ?? 0
  for (let j = 1; j < terms.length; j++) {
    value = apply(value, between[j - 1] ?? '+', terms[j] ?? 0)
    done.push(value)
  }
  return done
}

export function valueOf(
  numbers: readonly number[],
  ops: readonly Op[],
  spans: readonly Span[],
): number {
  return steps(numbers, ops, spans).at(-1) ?? numbers[0] ?? 0
}

/** True when nothing along the way drops below zero or rises above `max`. */
export function fits(
  numbers: readonly number[],
  ops: readonly Op[],
  spans: readonly Span[],
  max: number,
): boolean {
  return steps(numbers, ops, spans).every((v) => v >= 0 && v <= max)
}

export function tokensOf(
  numbers: readonly number[],
  ops: readonly Op[],
  spans: readonly Span[],
): Token[] {
  const tokens: Token[] = []
  numbers.forEach((n, i) => {
    if (i > 0) tokens.push(ops[i - 1] ?? '+')
    if (spans.some(([from]) => from === i)) tokens.push('(')
    tokens.push(n)
    if (spans.some(([, to]) => to === i)) tokens.push(')')
  })
  return tokens
}

export function written(tokens: readonly Token[]): string {
  return tokens
    .map((t) => (t === 'blank' ? '□' : String(t)))
    .join(' ')
    .replaceAll('( ', '(')
    .replaceAll(' )', ')')
}
