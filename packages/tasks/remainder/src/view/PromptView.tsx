import type { Task } from '@cogni/core'

import { isRemainderTask, remainderPlugin, type RemainderPrompt } from '../logic'

const CANDY = 26
const PAD = 6

/** `17 : 5 = □ (ост. 2)`, or the candies in framed heaps with the rest apart. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isRemainderTask(task)) return null
  const said = remainderPlugin.speak(task)
  const { prompt } = task
  if (prompt.show === 'number') {
    return (
      <p className="remainder-prompt" aria-label={said}>
        <span>{prompt.dividend}</span>
        <span>:</span>
        <span>{prompt.divisor}</span>
        <span>=</span>
        <Part prompt={prompt} part="quotient" />
        <small>
          (ост. <Part prompt={prompt} part="remainder" />)
        </small>
      </p>
    )
  }
  return (
    <figure className="remainder-picture">
      <figcaption>{said}</figcaption>
      <Heaps prompt={prompt} said={said} />
    </figure>
  )
}

function Part({
  prompt,
  part,
}: {
  readonly prompt: RemainderPrompt
  readonly part: 'quotient' | 'remainder'
}) {
  return prompt.ask === part ? (
    <span className="remainder-blank">□</span>
  ) : (
    <span>{prompt[part]}</span>
  )
}

/** One framed row per full heap, then the leftover candies without a frame. */
function Heaps({ prompt, said }: { readonly prompt: RemainderPrompt; readonly said: string }) {
  const { divisor, quotient, remainder } = prompt
  const row = CANDY + 2 * PAD
  const width = divisor * CANDY + 2 * PAD
  const height = (quotient + 1) * (row + PAD)
  const candies = (count: number, y: number) =>
    Array.from({ length: count }, (_, i) => (
      <circle
        key={i}
        cx={PAD + i * CANDY + CANDY / 2}
        cy={y + PAD + CANDY / 2}
        r={CANDY / 2 - 3}
        fill="#d0568c"
      />
    ))
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
      aria-label={said}
    >
      {Array.from({ length: quotient }, (_, heap) => {
        const y = heap * (row + PAD)
        return (
          <g key={heap}>
            <rect
              x={1}
              y={y + 1}
              width={width - 2}
              height={row - 2}
              rx={10}
              fill="#f6eadf"
              stroke="#8a6d4b"
              strokeWidth={2}
            />
            {candies(divisor, y)}
          </g>
        )
      })}
      {candies(remainder, quotient * (row + PAD))}
    </svg>
  )
}
