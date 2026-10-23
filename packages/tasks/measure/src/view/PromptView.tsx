import type { Task } from '@cogni/core'
import type { ReactNode } from 'react'

import { isMeasureTask, measurePlugin, THINGS, type MassPrompt, type VolumePrompt } from '../logic'

/** Scales or jars, with the question above them. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isMeasureTask(task)) return null
  const said = measurePlugin.speak(task)
  return (
    <figure className="measure-prompt">
      <figcaption>{said}</figcaption>
      {task.prompt.quantity === 'mass' ? (
        <Scales prompt={task.prompt} said={said} />
      ) : (
        <Jars prompt={task.prompt} said={said} />
      )}
    </figure>
  )
}

const WIDTH = 380
const PAN = 140
const PAN_TOP = 150
const LEFT_PAN = 95
const RIGHT_PAN = 285

/** A weight of each size: how wide and how tall it is drawn. */
const WEIGHT: Record<number, { readonly width: number; readonly height: number }> = {
  1: { width: 24, height: 20 },
  2: { width: 30, height: 26 },
  5: { width: 40, height: 32 },
}

const THING = { width: 60, height: 52 }

interface Piece {
  readonly width: number
  readonly height: number
  readonly draw: (x: number, bottom: number) => ReactNode
}

/** Pieces in rows along the pan, a new row on top when one is full. */
function stack(pieces: readonly Piece[], centre: number) {
  const rows: Piece[][] = [[]]
  for (const piece of pieces) {
    const row = rows[rows.length - 1] ?? []
    const used = row.reduce((w, p) => w + p.width + 3, 0)
    if (row.length > 0 && used + piece.width > PAN - 8) rows.push([piece])
    else row.push(piece)
  }
  let bottom = PAN_TOP
  return rows.flatMap((row, r) => {
    const width = row.reduce((w, p) => w + p.width + 3, -3)
    let x = centre - width / 2
    const drawn = row.map((piece, i) => {
      const node = <g key={`${String(r)}-${String(i)}`}>{piece.draw(x, bottom)}</g>
      x += piece.width + 3
      return node
    })
    bottom -= Math.max(...row.map((p) => p.height)) + 2
    return drawn
  })
}

function weight(kg: number): Piece {
  const { width, height } = WEIGHT[kg] ?? { width: 24, height: 20 }
  return {
    width,
    height,
    draw: (x, bottom) => (
      <>
        <polygon
          points={`${String(x + 5)},${String(bottom - height)} ${String(x + width - 5)},${String(bottom - height)} ${String(x + width)},${String(bottom)} ${String(x)},${String(bottom)}`}
          fill="#5a5a5a"
        />
        <text
          x={x + width / 2}
          y={bottom - height / 2 + 4}
          textAnchor="middle"
          fontSize={10}
          fill="#ffffff"
        >
          {kg} кг
        </text>
      </>
    ),
  }
}

function Scales({ prompt, said }: { readonly prompt: MassPrompt; readonly said: string }) {
  const thing = THINGS[prompt.thing]
  const thingPiece: Piece = {
    ...THING,
    draw: (x, bottom) => (
      <ellipse
        cx={x + THING.width / 2}
        cy={bottom - THING.height / 2}
        rx={THING.width / 2}
        ry={THING.height / 2}
        fill={thing.colour}
      />
    ),
  }
  return (
    <svg
      viewBox={`0 0 ${String(WIDTH)} 240`}
      width={WIDTH}
      height={240}
      role="img"
      aria-label={said}
    >
      <rect x={WIDTH / 2 - 6} y={170} width={12} height={55} fill="#8a7a5a" />
      <rect x={WIDTH / 2 - 50} y={222} width={100} height={12} rx={4} fill="#8a7a5a" />
      <rect x={LEFT_PAN} y={166} width={RIGHT_PAN - LEFT_PAN} height={8} rx={4} fill="#8a7a5a" />
      {[LEFT_PAN, RIGHT_PAN].map((centre) => (
        <g key={centre}>
          <rect x={centre - 3} y={PAN_TOP} width={6} height={18} fill="#8a7a5a" />
          <rect x={centre - PAN / 2} y={PAN_TOP} width={PAN} height={6} rx={3} fill="#c9a86a" />
        </g>
      ))}
      {stack([thingPiece, ...prompt.left.map(weight)], LEFT_PAN)}
      {stack(prompt.right.map(weight), RIGHT_PAN)}
      <text x={LEFT_PAN} y={196} textAnchor="middle" fontSize={16} fill="#3a3326">
        {thing.name}
      </text>
    </svg>
  )
}

const JAR_WIDTH = 46
const JAR_GAP = 10
const JAR_HEIGHT: Record<number, number> = { 1: 50, 2: 70, 3: 90 }
const PER_ROW = 5
const ROW = 120

function Jars({ prompt, said }: { readonly prompt: VolumePrompt; readonly said: string }) {
  const columns = Math.min(prompt.jars.length, PER_ROW)
  const width = columns * (JAR_WIDTH + JAR_GAP) + JAR_GAP
  const height = Math.ceil(prompt.jars.length / PER_ROW) * ROW
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
      aria-label={said}
    >
      {prompt.jars.map((litres, i) => {
        const jar = JAR_HEIGHT[litres] ?? 50
        const x = JAR_GAP + (i % PER_ROW) * (JAR_WIDTH + JAR_GAP)
        const bottom = Math.floor(i / PER_ROW) * ROW + 96
        const water = jar * 0.85
        return (
          <g key={i}>
            <rect
              x={x}
              y={bottom - jar}
              width={JAR_WIDTH}
              height={jar}
              rx={8}
              fill="#eef4f7"
              stroke="#7a8a94"
              strokeWidth={2}
            />
            <rect
              x={x + 3}
              y={bottom - water}
              width={JAR_WIDTH - 6}
              height={water - 3}
              rx={5}
              fill="#6aaed6"
            />
            <text
              x={x + JAR_WIDTH / 2}
              y={bottom + 18}
              textAnchor="middle"
              fontSize={15}
              fill="#3a3326"
            >
              {litres} л
            </text>
          </g>
        )
      })}
    </svg>
  )
}
