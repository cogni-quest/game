export const SHAPES = ['circle', 'triangle', 'square', 'star'] as const
export const COLOURS = ['red', 'blue', 'green', 'yellow'] as const

export type Shape = (typeof SHAPES)[number]
export type Colour = (typeof COLOURS)[number]

/** One figure of the row: a shape painted one colour. */
export interface Figure {
  readonly shape: Shape
  readonly colour: Colour
}

/** How a figure is named as a choice value: `circle-red`. */
export type FigureId = `${Shape}-${Colour}`

export function figureId({ shape, colour }: Figure): FigureId {
  return `${shape}-${colour}`
}

export function sameFigure(a: Figure, b: Figure): boolean {
  return a.shape === b.shape && a.colour === b.colour
}

const NOUN: Record<Shape, { readonly word: string; readonly feminine: boolean }> = {
  circle: { word: 'круг', feminine: false },
  triangle: { word: 'треугольник', feminine: false },
  square: { word: 'квадрат', feminine: false },
  star: { word: 'звезда', feminine: true },
}

const ADJECTIVE: Record<Colour, readonly [masculine: string, feminine: string]> = {
  red: ['красный', 'красная'],
  blue: ['синий', 'синяя'],
  green: ['зелёный', 'зелёная'],
  yellow: ['жёлтый', 'жёлтая'],
}

/** «красный круг», «жёлтая звезда» — the words on the button. */
export function figureLabel({ shape, colour }: Figure): string {
  const { word, feminine } = NOUN[shape]
  return `${ADJECTIVE[colour][feminine ? 1 : 0]} ${word}`
}
