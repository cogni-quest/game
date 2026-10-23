import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { figureId, figureLabel, type Figure } from './figures'
import { generatePattern, type PatternTask } from './generate'
import type { PatternKnobs } from './knobs'
import { patternPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: PatternKnobs) {
  const random = createRandom(16)
  return Array.from({ length: SAMPLES }, () => generatePattern(knobs, random))
}

/** The row with the right figure put into the empty place. */
function filled({ prompt, answer }: PatternTask): Figure[] {
  const [shape, colour] = answer.expected.split('-') as [Figure['shape'], Figure['colour']]
  return prompt.places.map((p) => (p === 'blank' ? { shape, colour } : p))
}

/** The shortest turn after which a feature of the row repeats. */
function period(values: readonly string[]): number {
  for (let p = 1; p <= values.length; p++) {
    if (values.every((v, i) => i < p || v === values[i - p])) return p
  }
  return values.length
}

const ALL: PatternKnobs[] = (['next', 'missing'] as const).flatMap((ask) =>
  (['two', 'three', 'two-features'] as const).map((unit) => ({ ask, unit })),
)

describe('generatePattern', () => {
  it.each(ALL)('$ask $unit: the answer completes a row that really repeats', (knobs) => {
    const wrong = sample(knobs).filter((task) => {
      const row = filled(task)
      const whole = period(row.map(figureId))
      const expected = knobs.unit === 'two' ? [2] : knobs.unit === 'three' ? [3] : [6]
      return (
        !expected.includes(whole) || task.prompt.places.filter((p) => p === 'blank').length !== 1
      )
    })
    expect(wrong).toEqual([])
  })

  it('turns shape and colour apart with two features, every two and every three', () => {
    const periods = new Set(
      sample({ ask: 'next', unit: 'two-features' }).map((t) => {
        const row = filled(t)
        return `${String(period(row.map((f) => f.shape)))}/${String(period(row.map((f) => f.colour)))}`
      }),
    )
    expect(periods).toEqual(new Set(['2/3', '3/2']))
  })

  it('shows the missing shape and the missing colour elsewhere in their own turn', () => {
    const wrong = ALL.flatMap(sample).filter((task) => {
      const { places } = task.prompt
      const blank = places.indexOf('blank')
      const row = filled(task)
      const seen = (feature: (f: Figure) => string) => {
        const turn = period(row.map(feature))
        return places.some((p, i) => p !== 'blank' && i !== blank && i % turn === blank % turn)
      }
      return !seen((f) => f.shape) || !seen((f) => f.colour)
    })
    expect(wrong).toEqual([])
  })

  it('puts the empty place at the end for «next», inside the row for «missing»', () => {
    const next = sample({ ask: 'next', unit: 'three' })
    expect(next.every((t) => t.prompt.places.at(-1) === 'blank')).toBe(true)
    const missing = sample({ ask: 'missing', unit: 'two' }).map((t) => ({
      at: t.prompt.places.indexOf('blank'),
      length: t.prompt.places.length,
    }))
    expect(missing.every(({ at, length }) => at >= 1 && at <= length - 2)).toBe(true)
  })

  it.each(ALL)('$ask $unit: options are different and include the answer', (knobs) => {
    const wrong = sample(knobs).filter(({ answer }) => {
      const values = answer.options.map((o) => o.value)
      const labels = answer.options.map((o) => o.label)
      return (
        new Set(values).size !== values.length ||
        new Set(labels).size !== labels.length ||
        !values.includes(answer.expected) ||
        values.length !== (knobs.unit === 'two-features' ? 4 : 3)
      )
    })
    expect(wrong).toEqual([])
  })

  it('offers, with two features, a figure right in shape only and one right in colour only', () => {
    const wrong = sample({ ask: 'missing', unit: 'two-features' }).filter(({ answer }) => {
      const [shape, colour] = answer.expected.split('-')
      const others = answer.options.map((o) => o.value).filter((v) => v !== answer.expected)
      return (
        !others.some((v) => v.startsWith(`${shape ?? ''}-`)) ||
        !others.some((v) => v.endsWith(`-${colour ?? ''}`))
      )
    })
    expect(wrong).toEqual([])
  })
})

describe('figureLabel', () => {
  it.each<[Figure, string]>([
    [{ shape: 'circle', colour: 'red' }, 'красный круг'],
    [{ shape: 'star', colour: 'yellow' }, 'жёлтая звезда'],
    [{ shape: 'triangle', colour: 'blue' }, 'синий треугольник'],
    [{ shape: 'star', colour: 'green' }, 'зелёная звезда'],
  ])('%j', (figure, label) => {
    expect(figureLabel(figure)).toBe(label)
  })
})

describe('patternPlugin', () => {
  it('asks the question aloud', () => {
    const task = patternPlugin.generateTyped({ ask: 'missing', unit: 'two' }, createRandom(1))
    expect(patternPlugin.speak(task)).toBe('Какой фигуры не хватает?')
  })

  it.each([{ ask: 'next', unit: 'four' }, { ask: 'previous', unit: 'two' }, { ask: 'next' }, null])(
    'refuses knobs that do not fit: %j',
    (knobs) => {
      expect(() => patternPlugin.generate(knobs, createRandom(1))).toThrow(/pattern/)
    },
  )
})
