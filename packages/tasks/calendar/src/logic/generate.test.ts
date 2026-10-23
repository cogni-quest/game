import { createRandom } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateCalendar, WEEKDAYS } from './generate'
import type { CalendarKnobs } from './knobs'
import { calendarPlugin } from './plugin'

const SAMPLES = 1_000

function sample(knobs: CalendarKnobs) {
  const random = createRandom(15)
  return Array.from({ length: SAMPLES }, () => generateCalendar(knobs, random))
}

describe('generateCalendar', () => {
  it('weekday: the answer is today moved by the shift, among four different days', () => {
    const wrong = sample({ ask: 'weekday' }).filter(({ prompt, answer }) => {
      if (prompt.ask !== 'weekday' || answer.shape !== 'choice') return true
      const right = WEEKDAYS[(prompt.today + prompt.shift + 7) % 7]?.value
      const values = answer.options.map((o) => o.value)
      return (
        answer.expected !== right ||
        prompt.shift === 0 ||
        Math.abs(prompt.shift) > 6 ||
        values.length !== 4 ||
        new Set(values).size !== 4 ||
        !values.includes(answer.expected)
      )
    })
    expect(wrong).toEqual([])
  })

  it('weekday: asks both forward and back', () => {
    const signs = new Set(
      sample({ ask: 'weekday' }).map((t) =>
        t.prompt.ask === 'weekday' ? Math.sign(t.prompt.shift) : 0,
      ),
    )
    expect(signs).toEqual(new Set([1, -1]))
  })

  it('month-days: the days of every month, February in an ordinary year', () => {
    const days = new Map(
      sample({ ask: 'month-days' }).map((t) => [
        t.prompt.ask === 'month-days' ? t.prompt.month : -1,
        t.answer.expected,
      ]),
    )
    expect([...days.entries()].sort(([a], [b]) => a - b)).toEqual([
      [0, 31],
      [1, 28],
      [2, 31],
      [3, 30],
      [4, 31],
      [5, 30],
      [6, 31],
      [7, 31],
      [8, 30],
      [9, 31],
      [10, 30],
      [11, 31],
    ])
  })
})

describe('calendarPlugin', () => {
  it('asks the question aloud', () => {
    const said = sample({ ask: 'weekday' }).map((t) => calendarPlugin.speak(t))
    expect(
      said.every((s) =>
        /^Сегодня [а-я]+\. Какой день недели (будет через \d (день|дня|дней)|был \d (день|дня|дней) назад)\?$/.test(
          s,
        ),
      ),
    ).toBe(true)
    const february = sample({ ask: 'month-days' }).find(
      (t) => t.prompt.ask === 'month-days' && t.prompt.month === 1,
    )
    expect(february && calendarPlugin.speak(february)).toBe(
      'Сколько дней в феврале в обычном году?',
    )
  })

  it.each([{ ask: 'year' }, {}, null])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => calendarPlugin.generate(knobs, createRandom(1))).toThrow(/calendar/)
  })
})
