import type { Task } from '@cogni/core'

import { clockPlugin, handAngles, isClockTask } from '../logic'

const SIZE = 300
const C = SIZE / 2
const FACE = 135

/** A point `length` from the centre, `degrees` clockwise from twelve. */
function at(degrees: number, length: number): readonly [number, number] {
  const radians = (degrees * Math.PI) / 180
  return [C + length * Math.sin(radians), C - length * Math.cos(radians)]
}

/** A plain clock face: twelve numbers, a short thick hour hand, a long minute hand. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isClockTask(task)) return null
  const said = clockPlugin.speak(task)
  const { hour, minute } = handAngles(task.prompt)
  const [hx, hy] = at(hour, 70)
  const [mx, my] = at(minute, 108)
  return (
    <figure className="clock-prompt">
      <figcaption>{said}</figcaption>
      <svg
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        width={SIZE}
        height={SIZE}
        role="img"
        aria-label={said}
      >
        <circle cx={C} cy={C} r={FACE} fill="#fffdf6" stroke="#3b3b3b" strokeWidth={5} />
        {Array.from({ length: 60 }, (_, i) => {
          const [x1, y1] = at(i * 6, FACE - 4)
          const [x2, y2] = at(i * 6, FACE - (i % 5 === 0 ? 16 : 9))
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3b3b3b"
              strokeWidth={i % 5 === 0 ? 3 : 1}
            />
          )
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1
          const [x, y] = at(n * 30, FACE - 38)
          return (
            <text
              key={n}
              x={x}
              y={y + 10}
              textAnchor="middle"
              fontSize={28}
              fontWeight={700}
              fill="#2b2b2b"
            >
              {n}
            </text>
          )
        })}
        <line
          x1={C}
          y1={C}
          x2={hx}
          y2={hy}
          stroke="#2b2b2b"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line
          x1={C}
          y1={C}
          x2={mx}
          y2={my}
          stroke="#b5452b"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={C} cy={C} r={8} fill="#2b2b2b" />
      </svg>
    </figure>
  )
}
