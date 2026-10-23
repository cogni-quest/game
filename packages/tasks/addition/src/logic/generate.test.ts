import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateAddition, type AdditionPrompt } from './generate'
import { additionKnobs, type Operation } from './knobs'
import { additionPlugin } from './plugin'

const SAMPLES = 2_000

/** A section without its operation, as the tests below write them. */
type Section = { readonly kind: string } & Record<string, unknown>

/** Knobs as the graph would give them, validated by the plugin's own schema. */
const knobs = (operation: Operation, section: Section) =>
  additionKnobs.parse({ operation, ...section })

function sample(operation: Operation, section: Section, seed = 1): AdditionPrompt[] {
  const random = createRandom(seed)
  const k = knobs(operation, section)
  return Array.from({ length: SAMPLES }, () => generateAddition(k, random).prompt)
}

const units = (n: number) => n % 10
const tens = (n: number) => Math.floor(n / 10)
const result = ({ left, right, operation }: AdditionPrompt) =>
  operation === '+' ? left + right : left - right

/** The examples that break a rule; the test expects none. */
const breaking = (prompts: AdditionPrompt[], ok: (p: AdditionPrompt) => boolean) =>
  prompts.filter((p) => !ok(p)).map((p) => `${String(p.left)}${p.operation}${String(p.right)}`)

const KINDS: Section[] = [
  { kind: 'within-10' },
  { kind: 'within-10', second: 2 },
  { kind: 'cross-ten' },
  { kind: 'round-tens' },
  { kind: 'two-digit-ones' },
  { kind: 'two-digit-tens' },
  { kind: 'two-digit' },
  { kind: 'to-round' },
  { kind: 'ones-carry' },
  { kind: 'two-digit-carry' },
  { kind: 'round-hundreds' },
  { kind: 'hundreds-tens' },
  { kind: 'tens-carry' },
  { kind: 'three-digit-round' },
  { kind: 'three-digit' },
]

describe('every task', () => {
  it.each(KINDS.flatMap((c) => (['+', '-'] as const).map((operation) => ({ operation, c }))))(
    '$c.kind $operation: answer is right, in range and keyed by its example',
    ({ operation, c }) => {
      const random = createRandom(9)
      const wrong: string[] = []
      for (let i = 0; i < SAMPLES; i++) {
        const task = generateAddition(knobs(operation, c), random)
        const { left, right } = task.prompt
        const expected = result(task.prompt)
        if (
          task.answer.expected !== expected ||
          expected < 0 ||
          expected > task.answer.upTo ||
          task.itemKey !== `${String(left)}${operation}${String(right)}`
        ) {
          wrong.push(task.itemKey)
        }
      }
      expect(wrong).toEqual([])
    },
  )
})

describe('within-10', () => {
  it('«±k»: the second number is exactly k, the result within ten', () => {
    expect(
      breaking(
        sample('+', { kind: 'within-10', second: 2 }),
        (p) => p.right === 2 && p.left >= 1 && result(p) <= 10,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'within-10', second: 1 }),
        (p) => p.right === 1 && result(p) >= 1 && p.left <= 10,
      ),
    ).toEqual([])
  })

  it('«+5 … +9» puts the small number first, to be swapped round', () => {
    expect(
      breaking(
        sample('+', { kind: 'within-10', secondFrom: 5 }),
        (p) => p.right >= 5 && p.left <= p.right && result(p) <= 10,
      ),
    ).toEqual([])
  })

  it('«6 − □ … 10 − □» takes a large number away and leaves something', () => {
    expect(
      breaking(
        sample('-', { kind: 'within-10', secondFrom: 5 }),
        (p) => p.right >= 5 && p.left <= 10 && result(p) >= 1,
      ),
    ).toEqual([])
  })

  it('`zero` asks only the zero facts, never 0 + 0', () => {
    expect(
      breaking(sample('+', { kind: 'within-10', zero: true }), (p) => p.right === 0 && p.left > 0),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'within-10', zero: true }),
        (p) => p.right === 0 || p.right === p.left,
      ),
    ).toEqual([])
  })

  it('brings zero to the whole table rarely, and never to a «±k» section', () => {
    expect(sample('+', { kind: 'within-10', second: 4 }).some((p) => p.right === 0)).toBe(false)
    const zeros = sample('+', { kind: 'within-10' }).filter((p) => p.left === 0 || p.right === 0)
    expect(zeros.length / SAMPLES).toBeGreaterThan(0.02)
    expect(zeros.length / SAMPLES).toBeLessThan(0.09)
  })
})

describe('cross-ten', () => {
  it('«□ + k»: crosses the ten, adding exactly k', () => {
    expect(
      breaking(
        sample('+', { kind: 'cross-ten', second: 3 }),
        (p) => p.left <= 9 && p.right === 3 && result(p) > 10,
      ),
    ).toEqual([])
  })

  it('«m − □»: breaks a ten open from exactly m', () => {
    expect(
      breaking(
        sample('-', { kind: 'cross-ten', minuend: 12 }),
        (p) => p.left === 12 && p.right > units(p.left) && p.right <= 9,
      ),
    ).toEqual([])
  })

  it('the whole table crosses the ten with single digits', () => {
    expect(
      breaking(
        sample('+', { kind: 'cross-ten' }),
        (p) => p.left <= 9 && p.right <= 9 && result(p) > 10,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'cross-ten' }),
        (p) => p.left >= 11 && p.left <= 18 && p.right > units(p.left) && p.right <= 9,
      ),
    ).toEqual([])
  })
})

describe('round-tens', () => {
  it('works in whole tens up to a hundred', () => {
    for (const operation of ['+', '-'] as const) {
      expect(
        breaking(
          sample(operation, { kind: 'round-tens' }),
          (p) => units(p.left) === 0 && units(p.right) === 0 && result(p) >= 10,
        ),
      ).toEqual([])
    }
  })
})

describe('two-digit without carrying', () => {
  it('two-digit-ones adds and takes a single digit, nothing carried', () => {
    expect(
      breaking(
        sample('+', { kind: 'two-digit-ones' }),
        (p) => p.left >= 11 && p.right <= 9 && units(p.left) + p.right <= 9,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'two-digit-ones' }),
        (p) => p.left >= 11 && p.right <= units(p.left),
      ),
    ).toEqual([])
  })

  it('two-digit-tens adds and takes whole tens, the units untouched', () => {
    for (const operation of ['+', '-'] as const) {
      expect(
        breaking(
          sample(operation, { kind: 'two-digit-tens' }),
          (p) => units(p.left) > 0 && units(p.right) === 0 && units(result(p)) === units(p.left),
        ),
      ).toEqual([])
    }
  })

  it('two-digit never carries, never borrows and is never all round tens', () => {
    expect(
      breaking(
        sample('+', { kind: 'two-digit' }),
        (p) =>
          p.left >= 10 &&
          units(p.left) + units(p.right) <= 9 &&
          tens(p.left) + tens(p.right) <= 9 &&
          units(p.left) + units(p.right) > 0,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'two-digit' }),
        (p) => units(p.left) > 0 && units(p.right) <= units(p.left) && result(p) > 0,
      ),
    ).toEqual([])
  })
})

describe('two-digit with carrying', () => {
  it('to-round lands on whole tens, or starts from them', () => {
    expect(
      breaking(
        sample('+', { kind: 'to-round' }),
        (p) => p.left >= 11 && p.right <= 9 && units(p.left) + p.right === 10,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'to-round' }),
        (p) => p.left >= 20 && units(p.left) === 0 && p.right >= 1 && p.right <= 9,
      ),
    ).toEqual([])
  })

  it('ones-carry carries a single digit past the tens', () => {
    expect(
      breaking(
        sample('+', { kind: 'ones-carry' }),
        (p) => p.left >= 11 && p.right <= 9 && units(p.left) + p.right > 10,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'ones-carry' }),
        (p) => p.left >= 21 && units(p.left) > 0 && p.right <= 9 && p.right > units(p.left),
      ),
    ).toEqual([])
  })

  it('two-digit-carry always carries under a hundred, and borrows from twenty up', () => {
    expect(
      breaking(
        sample('+', { kind: 'two-digit-carry' }),
        (p) => p.left >= 10 && units(p.left) + units(p.right) >= 10 && result(p) < 100,
      ),
    ).toEqual([])
    expect(
      breaking(
        sample('-', { kind: 'two-digit-carry' }),
        (p) => p.left >= 20 && units(p.right) > units(p.left) && result(p) > 0,
      ),
    ).toEqual([])
  })
})

describe('within a thousand', () => {
  const hundreds = (n: number) => Math.floor(n / 100)
  const tensDigit = (n: number) => tens(n) % 10
  const both = (kind: string) => [...sample('+', { kind }), ...sample('-', { kind })]

  it('round-hundreds works in whole hundreds up to a thousand', () => {
    expect(
      breaking(
        both('round-hundreds'),
        (p) => p.left % 100 === 0 && p.right % 100 === 0 && result(p) >= 100 && result(p) <= 1000,
      ),
    ).toEqual([])
  })

  it('hundreds-tens moves whole tens and never touches the hundreds', () => {
    expect(
      breaking(
        both('hundreds-tens'),
        (p) => p.right % 10 === 0 && p.right < 100 && hundreds(result(p)) === hundreds(p.left),
      ),
    ).toEqual([])
  })

  it('tens-carry always crosses a hundred', () => {
    expect(
      breaking(
        both('tens-carry'),
        (p) => p.right % 10 === 0 && p.right < 100 && hundreds(result(p)) !== hundreds(p.left),
      ),
    ).toEqual([])
  })

  it('three-digit-round keeps whole tens and nothing carries', () => {
    const plus = sample('+', { kind: 'three-digit-round' })
    const minus = sample('-', { kind: 'three-digit-round' })
    expect([
      ...breaking(
        plus,
        (p) => p.right >= 100 && tensDigit(p.left) + tensDigit(p.right) <= 9 && result(p) < 1000,
      ),
      ...breaking(
        minus,
        (p) => p.right >= 100 && tensDigit(p.left) >= tensDigit(p.right) && result(p) >= 1,
      ),
    ]).toEqual([])
  })
})

describe('additionPlugin', () => {
  it('generates from knobs given as data', () => {
    const task = additionPlugin.generate(
      { operation: '+', kind: 'cross-ten', second: 3 },
      createRandom(1),
    )
    expect(task.pluginId).toBe('addition')
  })

  it.each([
    { operation: '+', kind: 'within-7' },
    { operation: '*', kind: 'within-10' },
    { operation: '+', kind: 'within-10', second: 2, zero: true },
    { operation: '+', kind: 'within-10', second: 0 },
    { operation: '+', kind: 'cross-ten', minuend: 12 },
    { operation: '-', kind: 'cross-ten', second: 3 },
    { operation: '+', kind: 'cross-ten', second: 1 },
    { operation: '+', kind: 'round-tens', second: 1 },
    null,
  ])('refuses knobs that do not fit: %j', (k) => {
    expect(() => additionPlugin.generate(k, createRandom(1))).toThrow(/addition/)
  })

  it('speaks the example in words the teacher can read', () => {
    const task = additionPlugin.generateTyped(
      { operation: '-', kind: 'cross-ten', minuend: 16 },
      createRandom(1),
    )
    expect(additionPlugin.speak(task)).toMatch(/^шестнадцать минус [а-я]+$/)
  })
})

describe('how an example is shown', () => {
  it('mixes digits, pictures and words, and draws a picture only up to 20', () => {
    const random = createRandom(4)
    const within = Array.from({ length: SAMPLES }, () =>
      generateAddition(knobs('+', { kind: 'within-10' }), random),
    )
    expect(new Set(within.map((t) => t.prompt.show))).toEqual(
      new Set(['digits', 'picture', 'words']),
    )
    const big = Array.from({ length: SAMPLES }, () =>
      generateAddition(knobs('+', { kind: 'two-digit' }), random),
    )
    expect(
      big.filter(
        ({ prompt: p }) => p.show === 'picture' && Math.max(p.left, p.right, result(p)) > 20,
      ),
    ).toEqual([])
  })

  it('keeps one item for one example, however it is shown', () => {
    const shown = generateAddition(
      knobs('+', { kind: 'within-10', show: 'words' }),
      createRandom(2),
    )
    const same = generateAddition(
      knobs('+', { kind: 'within-10', show: 'digits' }),
      createRandom(2),
    )
    expect([shown.prompt.show, same.prompt.show]).toEqual(['words', 'digits'])
    expect(shown.itemKey).toBe(same.itemKey)
  })

  it('refuses a picture of numbers beyond 20', () => {
    expect(() =>
      additionKnobs.parse({ operation: '+', kind: 'two-digit', show: 'picture' }),
    ).toThrow()
  })
})
