import { createRandom, type Cell } from '@cogni/core'
import { describe, expect, it } from 'vitest'

import { generateLights, type LightsTask } from './generate'
import type { LightsKnobs } from './knobs'
import { lightsPlugin } from './plugin'

const SAMPLES = 300

function sample(knobs: LightsKnobs): LightsTask[] {
  const random = createRandom(23)
  return Array.from({ length: SAMPLES }, () => generateLights(knobs, random))
}

const at = ({ row, column }: Cell) => `${String(row)}.${String(column)}`

/** The sections of memory.json, and a few more. */
const KNOBS: readonly LightsKnobs[] = [
  { size: 3, length: 3 },
  { size: 3, length: 5 },
  { size: 3, length: 3, colours: 2 },
  { size: 4, length: 4, colours: 2 },
  { size: 4, length: 4, colours: 3 },
  { size: 3, length: 4, order: 'backward' },
  { size: 3, length: 3, order: 'backward', colours: 2 },
  { size: 3, length: 9 },
  { size: 5, length: 9, order: 'forward', colours: 4 },
]

const COLOURED = KNOBS.filter((k) => k.colours !== undefined)

describe('generateLights with colours', () => {
  it.each(COLOURED)('gives every light a colour of the palette, all of it used: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt }) => {
      const palette = prompt.colours ?? []
      const used = new Set(prompt.shown.map((c) => c.colour))
      return (
        palette.length !== knobs.colours ||
        prompt.shown.some((c) => c.colour === undefined || !palette.includes(c.colour as never)) ||
        used.size !== Math.min(knobs.length, palette.length)
      )
    })
    expect(wrong).toEqual([])
  })

  it('refuses the right lights in a wrong colour', () => {
    const [task] = sample({ size: 3, length: 3, colours: 2 })
    if (!task) throw new Error('no task')
    const repainted = task.answer.expected.map((c) => ({
      ...c,
      colour: c.colour === 'red' ? 'blue' : 'red',
    }))
    expect(task.answer.isCorrect(task.answer.expected)).toBe(true)
    expect(task.answer.isCorrect(repainted)).toBe(false)
  })

  it('leaves colours out when they are not asked', () => {
    const tasks = sample({ size: 3, length: 4 })
    expect(tasks.every((t) => t.prompt.colours === undefined)).toBe(true)
    expect(tasks.every((t) => t.prompt.shown.every((c) => c.colour === undefined))).toBe(true)
  })

  it('says the colour is to be remembered too', () => {
    const task = lightsPlugin.generateTyped({ size: 3, length: 3, colours: 2 }, createRandom(1))
    expect(lightsPlugin.speak(task)).toBe(
      'Загорятся 3 огонька. Запомни порядок и цвет каждого и нажми их так же.',
    )
  })
})

describe('generateLights', () => {
  it.each(KNOBS)('flashes as many different lights as asked, on the panel: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt }) => {
      const { shown } = prompt
      const inside = shown.every(
        (c) => c.row >= 0 && c.row < knobs.size && c.column >= 0 && c.column < knobs.size,
      )
      return (
        !inside || shown.length !== knobs.length || new Set(shown.map(at)).size !== shown.length
      )
    })
    expect(wrong).toEqual([])
  })

  it.each(KNOBS)('asks them back as shown, or from the last to the first: %j', (knobs) => {
    const wrong = sample(knobs).filter(({ prompt, answer }) => {
      const want = knobs.order === 'backward' ? [...prompt.shown].reverse() : prompt.shown
      return (
        !answer.isCorrect(want) ||
        answer.expected.map(at).join() !== want.map(at).join() ||
        answer.rows !== knobs.size
      )
    })
    expect(wrong).toEqual([])
  })

  it('refuses the order as shown when it is asked backwards', () => {
    const [task] = sample({ size: 3, length: 4, order: 'backward' })
    expect(task?.answer.isCorrect(task.prompt.shown)).toBe(false)
  })

  it('varies the lights and where the order starts', () => {
    const tasks = sample({ size: 3, length: 4 })
    expect(new Set(tasks.map((t) => t.itemKey)).size).toBeGreaterThan(SAMPLES * 0.9)
    const firsts = new Set(tasks.map((t) => at(t.prompt.shown[0] ?? { row: -1, column: -1 })))
    expect(firsts.size).toBe(9)
  })
})

describe('lightsPlugin', () => {
  it('says how many lights and which way to press them', () => {
    const forward = lightsPlugin.generateTyped({ size: 3, length: 5 }, createRandom(1))
    expect(lightsPlugin.speak(forward)).toBe(
      'Загорятся 5 огоньков. Запомни порядок и нажми их так же.',
    )
    const backward = lightsPlugin.generateTyped(
      { size: 3, length: 3, order: 'backward' },
      createRandom(1),
    )
    expect(lightsPlugin.speak(backward)).toMatch(/^Загорятся 3 огонька\. .*наоборот/)
  })

  it.each([
    { size: 2, length: 2 },
    { size: 6, length: 3 },
    { size: 3, length: 1 },
    { size: 3, length: 10 },
    { size: 3, length: 3, order: 'sideways' },
    { size: 3, length: 3, colours: 1 },
    { size: 3, length: 3, colours: 5 },
    { size: 3, length: 2, colours: 3 },
    { size: 3 },
    null,
  ])('refuses knobs that do not fit: %j', (knobs) => {
    expect(() => lightsPlugin.generate(knobs, createRandom(1))).toThrow(/lights/)
  })
})
