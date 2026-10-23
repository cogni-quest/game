import { createRandom, isChoiceAnswer } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import type { Token } from './expression'
import { generateChain } from './generate'
import type { ChainKnobs } from './knobs'
import { chainPlugin } from './plugin'

const SAMPLES = 500

function sample(knobs: ChainKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateChain(knobs, random))
}

/**
 * Works out written tokens on its own — brackets first, then left to right —
 * and lists every value along the way.
 */
function evaluate(tokens: readonly Token[]): { value: number; along: number[] } {
  const along: number[] = []
  let at = 0
  const term = (): number => {
    const t = tokens[at++]
    if (t === '(') {
      const v = expression()
      at++ // ')'
      return v
    }
    return typeof t === 'number' ? t : NaN
  }
  const expression = (): number => {
    let v = term()
    while (tokens[at] === '+' || tokens[at] === '−') {
      const op = tokens[at++]
      const right = term()
      v = op === '+' ? v + right : v - right
      along.push(v)
    }
    return v
  }
  return { value: expression(), along }
}

const before = (tokens: readonly Token[]) => tokens.slice(0, tokens.indexOf('='))

/** The tokens of a label like «20 − (5 + 3)». */
function parse(label: string): Token[] {
  return (label.match(/\d+|[+−()]/g) ?? []).map((t) => (/\d/.test(t) ? Number(t) : (t as Token)))
}

describe('generateChain', () => {
  it.each<ChainKnobs>([
    { ask: 'value', terms: 3, max: 20 },
    { ask: 'value', terms: 4, max: 20 },
    { ask: 'value', terms: 3, max: 20, brackets: true },
    { ask: 'value', terms: 4, max: 100, brackets: true },
    { ask: 'value', terms: 3, max: 100, convenient: true },
  ])('the answer is the value, every step within 0…max: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const { value, along } = evaluate(before(prompt.tokens))
      return answer.expected !== value || along.some((v) => v < 0 || v > knobs.max)
    })
    expect(wrong).toEqual([])
  })

  it('puts brackets where they change the result', () => {
    const wrong = sample({ ask: 'value', terms: 4, max: 100, brackets: true }).filter(
      ({ prompt }) => {
        const tokens = before(prompt.tokens)
        const plain = tokens.filter((t) => t !== '(' && t !== ')')
        return (
          !tokens.includes('(') ||
          tokens[0] === '(' ||
          evaluate(plain).value === evaluate(tokens).value
        )
      },
    )
    expect(wrong).toEqual([])
  })

  it('convenient: only pluses, no round term, and two terms make a round ten', () => {
    const wrong = sample({ ask: 'value', terms: 3, max: 100, convenient: true }).filter(
      ({ prompt }) => {
        const numbers = before(prompt.tokens).filter((t) => typeof t === 'number')
        const pair = numbers.some((a, i) => numbers.some((b, j) => j > i && (a + b) % 10 === 0))
        return before(prompt.tokens).includes('−') || numbers.some((n) => n % 10 === 0) || !pair
      },
    )
    expect(wrong).toEqual([])
  })

  it.each<ChainKnobs>([
    { ask: 'brackets', terms: 3, max: 20 },
    { ask: 'brackets', terms: 4, max: 100 },
  ])('«где скобки?»: options differ, and only the answer gives the result: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      if (!isChoiceAnswer(answer)) return true
      const result = prompt.tokens.at(-1)
      const values = answer.options.map((o) => evaluate(parse(o.label)).value)
      const right = answer.options.findIndex((o) => o.value === answer.expected)
      const steps = answer.options.flatMap((o) => evaluate(parse(o.label)).along)
      return (
        new Set(values).size !== values.length ||
        values[right] !== result ||
        answer.options.length < 2 ||
        answer.options.length > 4 ||
        steps.some((v) => v < 0 || v > knobs.max)
      )
    })
    expect(wrong).toEqual([])
  })
})

describe('chainPlugin', () => {
  it('reads brackets aloud', () => {
    const task = chainPlugin.generateTyped(
      { ask: 'value', terms: 3, max: 20, brackets: true },
      createRandom(2),
    )
    expect(chainPlugin.speak(task)).toMatch(
      /^Сколько будет \d+ (плюс|минус), скобка открывается, \d+ (плюс|минус) \d+, скобка закрывается\?$/,
    )
  })

  it('asks where the brackets go', () => {
    const task = chainPlugin.generateTyped({ ask: 'brackets', terms: 3, max: 20 }, createRandom(2))
    expect(chainPlugin.speak(task)).toBe(
      `Где поставить скобки, чтобы получилось ${String(task.prompt.tokens.at(-1))}?`,
    )
  })

  it.each([
    { ask: 'value', terms: 5, max: 20 },
    { ask: 'value', terms: 3, max: 20, brackets: true, convenient: true },
    { ask: 'brackets', terms: 3, max: 20, convenient: true },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => chainPlugin.generate(knobs, createRandom(1))).toThrow(/chain/)
  })
})
