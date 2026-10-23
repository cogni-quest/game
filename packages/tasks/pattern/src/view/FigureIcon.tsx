import type { Colour, Figure } from '../logic'

const FILL: Record<Colour, string> = {
  red: '#d6453a',
  blue: '#3a6fd6',
  green: '#3a9e4f',
  yellow: '#f2c230',
}

const STROKE = '#2b2b2b'

/** One figure in a square of `size`, drawn where it stands: `x`, `y` is its corner. */
export function FigureShape({
  figure,
  x,
  y,
  size,
}: {
  readonly figure: Figure
  readonly x: number
  readonly y: number
  readonly size: number
}) {
  const fill = FILL[figure.colour]
  const c = size / 2
  const r = size * 0.42
  const common = { fill, stroke: STROKE, strokeWidth: 2, strokeLinejoin: 'round' as const }
  switch (figure.shape) {
    case 'circle':
      return <circle cx={x + c} cy={y + c} r={r} {...common} />
    case 'square':
      return (
        <rect
          x={x + c - r * 0.85}
          y={y + c - r * 0.85}
          width={r * 1.7}
          height={r * 1.7}
          {...common}
        />
      )
    case 'triangle': {
      const points = [
        [x + c, y + c - r],
        [x + c + r, y + c + r * 0.8],
        [x + c - r, y + c + r * 0.8],
      ]
      return <polygon points={points.map((p) => p.join(',')).join(' ')} {...common} />
    }
    case 'star': {
      const points = Array.from({ length: 10 }, (_, i) => {
        const radius = i % 2 === 0 ? r : r * 0.45
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        return `${String(x + c + radius * Math.cos(angle))},${String(y + c + radius * Math.sin(angle))}`
      })
      return <polygon points={points.join(' ')} {...common} />
    }
  }
}

/** A figure on its own, for a button that shows the picture beside its words. */
export function FigureIcon({
  figure,
  size = 48,
}: {
  readonly figure: Figure
  readonly size?: number
}) {
  return (
    <svg viewBox={`0 0 ${String(size)} ${String(size)}`} width={size} height={size} aria-hidden>
      <FigureShape figure={figure} x={0} y={0} size={size} />
    </svg>
  )
}
