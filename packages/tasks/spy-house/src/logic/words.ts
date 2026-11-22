import type { Clue, Landmark } from './generate'

/**
 * A piece of the report: words, or a landmark — which the screen draws as its
 * picture and the voice says in the case the sentence needs.
 */
export type Segment =
  | { readonly text: string }
  | { readonly landmark: Landmark; readonly form: 'genitive' | 'instrumental' }

/** «от кота», «между котом и…». */
export const NAMES: Record<Landmark, { readonly genitive: string; readonly instrumental: string }> =
  {
    cat: { genitive: 'кота', instrumental: 'котом' },
    cactus: { genitive: 'кактуса', instrumental: 'кактусом' },
    teddy: { genitive: 'мишки', instrumental: 'мишкой' },
  }

const PLACE: Readonly<Record<number, string>> = { 2: 'во втором', 3: 'в третьем' }

const text = (words: string): Segment => ({ text: words })

/** One clue as the report reads it. `windows` decides «в левом» or «в крайнем левом». */
export function clueSegments(clue: Clue, windows: number): Segment[] {
  switch (clue.kind) {
    case 'floor':
      return [text(`на ${String(clue.floor)} этаже`)]
    case 'edge': {
      if (clue.edge === 'middle') return [text('в среднем окне')]
      const side = clue.edge === 'left' ? 'левом' : 'правом'
      return [text(windows === 2 ? `в ${side} окне` : `в крайнем ${side} окне`)]
    }
    case 'ordinal':
      return [
        text(
          `${PLACE[clue.place] ?? `в ${String(clue.place)}-м`} окне ${clue.side === 'left' ? 'слева' : 'справа'}`,
        ),
      ]
    case 'beside':
      return [
        text(`сразу ${clue.side === 'left' ? 'слева' : 'справа'} от `),
        { landmark: clue.of, form: 'genitive' },
      ]
    case 'between':
      return [
        text('между '),
        { landmark: clue.of[0], form: 'instrumental' },
        text(' и '),
        { landmark: clue.of[1], form: 'instrumental' },
      ]
    case 'vertical':
      return [
        text(`сразу ${clue.side === 'above' ? 'над' : 'под'} `),
        { landmark: clue.of, form: 'instrumental' },
      ]
  }
}

/** The whole report: «Шпион на 3 этаже, сразу слева от 🐱.» */
export function reportSegments(clues: readonly Clue[], windows: number): Segment[] {
  return [
    text('Шпион '),
    ...clues.flatMap((clue, i) => [
      ...(i === 0 ? [] : [text(', ')]),
      ...clueSegments(clue, windows),
    ]),
    text('.'),
  ]
}

/** Segments as plain words, for the voice and the analytics. */
export function spoken(segments: readonly Segment[]): string {
  return segments.map((s) => ('text' in s ? s.text : NAMES[s.landmark][s.form])).join('')
}
