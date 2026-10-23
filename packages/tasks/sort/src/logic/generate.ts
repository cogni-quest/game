import { pick, pickAnswer, randomInt, type PickAnswer, type Random, type Task } from '@cogni/core'

import type { SortKnobs } from './knobs'

/** A kind of thing, its words, and how it is asked for: «выбери все фрукты». */
interface Category {
  readonly id: string
  readonly asked: string
  readonly words: readonly string[]
}

export const CATEGORIES: readonly Category[] = [
  { id: 'fruit', asked: 'фрукты', words: ['яблоко', 'груша', 'слива', 'банан', 'апельсин'] },
  { id: 'vegetables', asked: 'овощи', words: ['морковь', 'огурец', 'помидор', 'капуста', 'лук'] },
  { id: 'animals', asked: 'животных', words: ['кошка', 'собака', 'корова', 'лошадь', 'заяц'] },
  {
    id: 'transport',
    asked: 'виды транспорта',
    words: ['машина', 'автобус', 'поезд', 'самолёт', 'трамвай'],
  },
]

export const SHAPES = ['circle', 'square', 'triangle'] as const
export const COLOURS = ['red', 'blue', 'green'] as const
export type Shape = (typeof SHAPES)[number]
export type Colour = (typeof COLOURS)[number]

export interface Figure {
  readonly shape: Shape
  readonly colour: Colour
}

/** «Выбери все красные круги» — the accusative plural, animate or not. */
const SHAPE_WORDS: Record<Shape, string> = {
  circle: 'круги',
  square: 'квадраты',
  triangle: 'треугольники',
}
const COLOUR_WORDS: Record<Colour, string> = { red: 'красные', blue: 'синие', green: 'зелёные' }

export type SortPrompt =
  | { readonly by: 'category'; readonly asked: string }
  | { readonly by: 'two-features'; readonly asked: Figure; readonly figures: readonly Figure[] }

export type SortTask = Task<SortPrompt, PickAnswer>

export const PLUGIN_ID = 'sort'

export function isSortTask(task: Task): task is SortTask {
  return task.pluginId === PLUGIN_ID
}

/** «Красные круги», as asked. */
export function figureWords({ shape, colour }: Figure): string {
  return `${COLOUR_WORDS[colour]} ${SHAPE_WORDS[shape]}`
}

const WORDS = [6, 8] as const
const FIGURES = [6, 9] as const

export function generateSort({ by }: SortKnobs, random: Random): SortTask {
  return by === 'category' ? byCategory(random) : byFeatures(random)
}

/** Two to four words of the asked kind among words of the other kinds. */
function byCategory(random: Random): SortTask {
  const kind = pick(random, CATEGORIES)
  const total = randomInt(random, WORDS[0], WORDS[1])
  const right = shuffled(random, kind.words).slice(0, randomInt(random, 2, 4))
  const others = shuffled(
    random,
    CATEGORIES.filter((c) => c !== kind).flatMap((c) => c.words),
  ).slice(0, total - right.length)
  const words = shuffled(random, [...right, ...others])
  const options = words.map((word) => ({ value: word, label: word }))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `sort:${kind.id}:${words.join(',')}`,
    prompt: { by: 'category', asked: kind.asked },
    answer: pickAnswer(
      words.filter((w) => right.includes(w)),
      options,
    ),
  }
}

/**
 * Shapes in a row, numbered; some have both asked features, and among the
 * rest are ones with each feature alone, so one feature never does.
 */
function byFeatures(random: Random): SortTask {
  const asked: Figure = { shape: pick(random, SHAPES), colour: pick(random, COLOURS) }
  const total = randomInt(random, FIGURES[0], FIGURES[1])
  const right = randomInt(random, 2, 3)
  const sameShape: Figure = {
    shape: asked.shape,
    colour: pick(
      random,
      COLOURS.filter((c) => c !== asked.colour),
    ),
  }
  const sameColour: Figure = {
    shape: pick(
      random,
      SHAPES.filter((s) => s !== asked.shape),
    ),
    colour: asked.colour,
  }
  const rest = Array.from({ length: total - right - 2 }, (): Figure => {
    for (;;) {
      const figure = { shape: pick(random, SHAPES), colour: pick(random, COLOURS) }
      if (figure.shape !== asked.shape || figure.colour !== asked.colour) return figure
    }
  })
  const figures = shuffled(random, [
    ...Array.from({ length: right }, () => asked),
    sameShape,
    sameColour,
    ...rest,
  ])
  const options = figures.map((_, i) => ({ value: String(i + 1), label: String(i + 1) }))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `sort:${asked.colour}-${asked.shape}:${figures.map((f) => `${f.colour[0] ?? ''}${f.shape[0] ?? ''}`).join(',')}`,
    prompt: { by: 'two-features', asked, figures },
    answer: pickAnswer(
      options
        .filter((_, i) => {
          const f = figures[i]
          return f?.shape === asked.shape && f.colour === asked.colour
        })
        .map((o) => o.value),
      options,
    ),
  }
}

function shuffled<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = result[i]
    const b = result[j]
    if (a === undefined || b === undefined) throw new RangeError('shuffle out of range')
    result[i] = b
    result[j] = a
  }
  return result
}
