import {
  cellOrderAnswer,
  pick,
  randomInt,
  type Cell,
  type CellOrderAnswer,
  type OrderedCell,
  type Random,
  type Task,
} from '@cogni/core'

import type { LightsKnobs } from './knobs'

export type Order = 'forward' | 'backward'

/**
 * The colours a coloured program uses, the first `colours` of them: told
 * apart by hue and by brightness, so no two are near each other.
 */
export const COLOURS = ['red', 'blue', 'yellow', 'green'] as const
export type Colour = (typeof COLOURS)[number]

export interface LightsPrompt {
  /** Lights to a side. */
  readonly size: number
  /** The lights in the order they flash, each with its colour when colours are asked. */
  readonly shown: readonly OrderedCell[]
  /** Whether they are pressed back as shown, or from the last to the first. */
  readonly order: Order
  /** The colours to choose from, when the colour is part of the answer. */
  readonly colours?: readonly Colour[]
}

export type LightsAnswer = CellOrderAnswer
export type LightsTask = Task<LightsPrompt, LightsAnswer>

export const PLUGIN_ID = 'lights'

export function isLightsTask(task: Task): task is LightsTask {
  return task.pluginId === PLUGIN_ID
}

const key = ({ row, column, colour }: OrderedCell) =>
  `${String(row)}.${String(column)}${colour === undefined ? '' : `:${colour}`}`

/** Shuffles a list in place, the first `count` places only. */
function shuffle(items: unknown[], count: number, random: Random): void {
  for (let i = 0; i < count; i++) {
    const j = randomInt(random, i, items.length - 1)
    const a = items[i]
    const b = items[j]
    if (a === undefined || b === undefined) throw new Error('Nothing left to shuffle')
    items[i] = b
    items[j] = a
  }
}

/**
 * A colour per light. Every colour on the palette is used at least once when
 * there are lights enough, so the colour always matters: three lights in two
 * colours are never all red.
 */
function colourFor(length: number, colours: readonly Colour[], random: Random): Colour[] {
  const picked: Colour[] = colours.slice(0, Math.min(length, colours.length))
  while (picked.length < length) picked.push(pick(random, colours))
  shuffle(picked, picked.length, random)
  return picked
}

export function generateLights(knobs: LightsKnobs, random: Random): LightsTask {
  const { size, length } = knobs
  const order = knobs.order ?? 'forward'
  if (length > size * size) {
    throw new RangeError(
      `${String(length)} lights do not fit a ${String(size)} × ${String(size)} panel`,
    )
  }

  // A partial shuffle: the first `length` lights of the panel in random order.
  const panel: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) panel.push({ row, column })
  }
  shuffle(panel, length, random)
  const places = panel.slice(0, length)

  const palette = knobs.colours === undefined ? undefined : COLOURS.slice(0, knobs.colours)
  const painted = palette === undefined ? undefined : colourFor(length, palette, random)
  const shown: OrderedCell[] = places.map((cell, i) => {
    const colour = painted?.[i]
    return colour === undefined ? cell : { ...cell, colour }
  })
  const expected = order === 'forward' ? shown : [...shown].reverse()

  return {
    pluginId: PLUGIN_ID,
    itemKey: `lights:${String(size)}:${order}:${shown.map(key).join(',')}`,
    prompt: { size, shown, order, ...(palette === undefined ? {} : { colours: palette }) },
    answer: cellOrderAnswer(expected, size, size),
  }
}
