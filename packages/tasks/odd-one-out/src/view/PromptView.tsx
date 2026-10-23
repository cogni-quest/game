import type { Task } from '@cogni/core'

import { isOddOneOutTask, oddOneOutPlugin, type Colour, type Item, type Shape } from '../logic'

const BOX = 120
const RADIUS: Record<'big' | 'small', number> = { big: 50, small: 26 }
const FILL: Record<Colour, string> = {
  red: '#c94c3c',
  blue: '#3f6fb5',
  green: '#3a7d44',
  yellow: '#e2b33c',
}

/** Four cards in a row, each with its number under it. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isOddOneOutTask(task)) return null
  const said = oddOneOutPlugin.speak(task)
  return (
    <figure className="odd-one-out-prompt" aria-label={said}>
      <figcaption>{said}</figcaption>
      <ol className="odd-one-out-items">
        {task.prompt.items.map((item, i) => (
          <li key={i} className="odd-one-out-card">
            <Card item={item} />
            <span className="odd-one-out-place">{i + 1}</span>
          </li>
        ))}
      </ol>
    </figure>
  )
}

function Card({ item }: { readonly item: Item }) {
  switch (item.kind) {
    case 'figure':
      return (
        <svg viewBox={`0 0 ${String(BOX)} ${String(BOX)}`} width={BOX} height={BOX} role="img">
          <Figure shape={item.shape} r={RADIUS[item.size]} fill={FILL[item.colour]} />
        </svg>
      )
    case 'word':
      return <span className="odd-one-out-word">{item.text}</span>
    case 'number':
      return <span className="odd-one-out-number">{item.value}</span>
  }
}

function Figure({
  shape,
  r,
  fill,
}: {
  readonly shape: Shape
  readonly r: number
  readonly fill: string
}) {
  const c = BOX / 2
  switch (shape) {
    case 'circle':
      return <circle cx={c} cy={c} r={r} fill={fill} />
    case 'square':
      return <rect x={c - r * 0.85} y={c - r * 0.85} width={r * 1.7} height={r * 1.7} fill={fill} />
    case 'triangle':
      return <polygon points={corners(c, r, 3, -90)} fill={fill} />
    case 'star':
      return <polygon points={star(c, r)} fill={fill} />
  }
}

/** A regular polygon's corners as an SVG `points` string. */
function corners(c: number, r: number, n: number, start: number): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 / n) * i) * Math.PI) / 180
    return `${String(c + r * Math.cos(a))},${String(c + r * Math.sin(a))}`
  }).join(' ')
}

/** A five-pointed star: outer and inner corners in turn. */
function star(c: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + 36 * i) * Math.PI) / 180
    const radius = i % 2 === 0 ? r : r * 0.45
    return `${String(c + radius * Math.cos(a))},${String(c + radius * Math.sin(a))}`
  }).join(' ')
}
