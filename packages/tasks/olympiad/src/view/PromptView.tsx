import { counted, type Task } from '@cogni/core'

import {
  HEIGHT,
  isOlympiadTask,
  olympiadPlugin,
  thing,
  WIDTH,
  type Apart,
  type Lines,
  type Pan,
  type Scale,
} from '../logic'

const STROKE = '#2b2b2b'
const FILL = '#f2c48d'

/** The puzzle drawn big, its question written above it. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isOlympiadTask(task)) return null
  const said = olympiadPlugin.speak(task)
  const { prompt } = task
  return (
    <figure className="olympiad-prompt">
      <figcaption>{said}</figcaption>
      {prompt.ask === 'figures' ? (
        <svg
          viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label={said}
        >
          {prompt.drawing.type === 'lines' ? (
            <Drawn drawing={prompt.drawing} />
          ) : (
            <Shapes drawing={prompt.drawing} />
          )}
        </svg>
      ) : (
        <svg
          viewBox={`0 0 ${String(SCALE_WIDTH)} ${String(SCALE_HEIGHT * prompt.scales.length)}`}
          width={SCALE_WIDTH}
          height={SCALE_HEIGHT * prompt.scales.length}
          role="img"
          aria-label={said}
        >
          {prompt.scales.map((scale, i) => (
            <Balance key={i} scale={scale} y={i * SCALE_HEIGHT} />
          ))}
        </svg>
      )}
    </figure>
  )
}

/** Every line from its first point to its last, thick, on a light fill. */
function Drawn({ drawing }: { readonly drawing: Lines }) {
  return drawing.lines.map((line, i) => {
    const from = drawing.points[line[0] ?? 0]
    const to = drawing.points[line[line.length - 1] ?? 0]
    if (!from || !to) return null
    return (
      <line
        key={i}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={STROKE}
        strokeWidth={4}
        strokeLinecap="round"
      />
    )
  })
}

const SIZE = 30

function Shapes({ drawing }: { readonly drawing: Apart }) {
  return drawing.shapes.map(({ kind, x, y }, i) => {
    switch (kind) {
      case 'circle':
        return <circle key={i} cx={x} cy={y} r={SIZE} fill={FILL} stroke={STROKE} strokeWidth={3} />
      case 'square':
        return (
          <rect
            key={i}
            x={x - SIZE}
            y={y - SIZE}
            width={2 * SIZE}
            height={2 * SIZE}
            fill={FILL}
            stroke={STROKE}
            strokeWidth={3}
          />
        )
      case 'triangle':
        return <Polygon key={i} x={x} y={y} corners={3} />
      case 'pentagon':
        return <Polygon key={i} x={x} y={y} corners={5} />
    }
  })
}

function Polygon({
  x,
  y,
  corners,
}: {
  readonly x: number
  readonly y: number
  readonly corners: number
}) {
  const points = Array.from({ length: corners }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / corners
    return `${String(Math.round(x + SIZE * 1.1 * Math.cos(angle)))},${String(Math.round(y + SIZE * 1.1 * Math.sin(angle)))}`
  }).join(' ')
  return <polygon points={points} fill={FILL} stroke={STROKE} strokeWidth={3} />
}

const SCALE_WIDTH = 420
const SCALE_HEIGHT = 150
/** The most things drawn one by one on a pan; with more, one stands for them all. */
const DRAWN = 6

/** Scales in equilibrium: a level beam on a stand, a pan of things at each end. */
function Balance({ scale, y }: { readonly scale: Scale; readonly y: number }) {
  const beam = y + 70
  return (
    <g>
      <rect x={SCALE_WIDTH / 2 - 6} y={beam} width={12} height={60} fill="#8a6d3b" />
      <rect x={SCALE_WIDTH / 2 - 40} y={beam + 56} width={80} height={10} rx={3} fill="#8a6d3b" />
      <rect x={30} y={beam - 4} width={SCALE_WIDTH - 60} height={8} rx={3} fill="#8a6d3b" />
      <PanOf pan={scale.left} x={105} y={beam} />
      <PanOf pan={scale.right} x={SCALE_WIDTH - 105} y={beam} />
    </g>
  )
}

function PanOf({ pan, x, y }: { readonly pan: Pan; readonly x: number; readonly y: number }) {
  const { names, colour } = thing(pan.thing)
  const drawn = pan.count <= DRAWN ? pan.count : 1
  const r = 13
  const perRow = 3
  return (
    <g>
      <path d={`M ${String(x - 75)} ${String(y - 6)} h 150 l -15 12 h -120 z`} fill="#c9b48a" />
      {Array.from({ length: drawn }, (_, i) => {
        const row = Math.floor(i / perRow)
        const inRow = Math.min(perRow, drawn - row * perRow)
        const col = i % perRow
        return (
          <circle
            key={i}
            cx={x + (col - (inRow - 1) / 2) * (2 * r + 4)}
            cy={y - 6 - r - row * (2 * r + 2)}
            r={r}
            fill={colour}
            stroke={STROKE}
            strokeWidth={1.5}
          />
        )
      })}
      <text x={x} y={y + 30} textAnchor="middle" fontSize={18} fill={STROKE}>
        {counted(pan.count, names)}
      </text>
    </g>
  )
}
