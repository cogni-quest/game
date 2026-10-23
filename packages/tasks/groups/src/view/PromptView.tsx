import type { Task } from '@cogni/core'
import type { ReactNode } from 'react'

import { groupsPlugin, isGroupsTask, type GroupsPrompt } from '../logic'

const CANDY = 32
const PLATE_PAD = 10
const PLATES_A_ROW = 3
const CANDIES_A_ROW = 10

type LinePrompt = Extract<GroupsPrompt, { ask: 'sum' | 'product' | 'commutative' }>
type PicturePrompt = Exclude<GroupsPrompt, LinePrompt>

function isLine(prompt: GroupsPrompt): prompt is LinePrompt {
  return prompt.ask === 'sum' || prompt.ask === 'product' || prompt.ask === 'commutative'
}

/** Equal terms written out, `3 × 4 □ 4 × 3`, or a picture of plates, rows or candies. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isGroupsTask(task)) return null
  const said = groupsPlugin.speak(task)
  const { prompt } = task
  if (isLine(prompt)) {
    return (
      <p className="groups-line" aria-label={said}>
        {line(prompt)}
      </p>
    )
  }
  return (
    <figure className="groups-prompt">
      <figcaption>{said}</figcaption>
      <Picture prompt={prompt} said={said} />
    </figure>
  )
}

/** `3 + 3 + 3 = □`, `3 + 3 + 3 = 3 × □`, `3 × 4 □ 4 × 3`. */
function line(prompt: LinePrompt): ReactNode {
  const box = <span className="groups-blank">□</span>
  switch (prompt.ask) {
    case 'sum':
    case 'product': {
      const terms = Array.from({ length: prompt.count }, () => String(prompt.size)).join(' + ')
      return (
        <>
          <span>{terms}</span>
          <span>=</span>
          {prompt.ask === 'product' && <span>{prompt.size} ×</span>}
          {box}
        </>
      )
    }
    case 'commutative':
      return (
        <>
          <span>
            {prompt.left[0]} × {prompt.left[1]}
          </span>
          {box}
          <span>
            {prompt.right[0]} × {prompt.right[1]}
          </span>
        </>
      )
  }
}

function Picture({ prompt, said }: { readonly prompt: PicturePrompt; readonly said: string }) {
  switch (prompt.ask) {
    case 'plates':
      return (
        <Plates plates={Array.from({ length: prompt.groups }, () => prompt.size)} said={said} />
      )
    case 'share':
      return (
        <div className="groups-share">
          <Candies count={prompt.total} said={said} />
          <Plates plates={Array.from({ length: prompt.groups }, () => 0)} />
        </div>
      )
    case 'measure-out':
      return <Candies count={prompt.total} said={said} />
    case 'array':
      return <Grid rows={prompt.rows} columns={prompt.columns} said={said} />
  }
}

/** Plates in rows of three, each with its candies in one row. */
/** Without `said`, the plates are part of a bigger picture and not named on their own. */
function Plates({ plates, said }: { readonly plates: readonly number[]; readonly said?: string }) {
  const most = Math.max(2, ...plates)
  const plateWidth = most * CANDY + 2 * PLATE_PAD + 16
  const plateHeight = CANDY + 2 * PLATE_PAD + 12
  const gap = 16
  const columns = Math.min(PLATES_A_ROW, plates.length)
  const rows = Math.ceil(plates.length / PLATES_A_ROW)
  const width = columns * plateWidth + (columns - 1) * gap
  const height = rows * plateHeight + (rows - 1) * gap
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
      aria-label={said}
    >
      {plates.map((candies, p) => {
        const x = (p % PLATES_A_ROW) * (plateWidth + gap)
        const y = Math.floor(p / PLATES_A_ROW) * (plateHeight + gap)
        const start = x + (plateWidth - candies * CANDY) / 2
        return (
          <g key={p}>
            <ellipse
              cx={x + plateWidth / 2}
              cy={y + plateHeight / 2}
              rx={plateWidth / 2 - 2}
              ry={plateHeight / 2 - 2}
              fill="#f4efe3"
              stroke="#b8ad94"
              strokeWidth={3}
            />
            {Array.from({ length: candies }, (_, i) => (
              <circle
                key={i}
                cx={start + i * CANDY + CANDY / 2}
                cy={y + plateHeight / 2}
                r={CANDY / 2 - 3}
                fill="#e8833a"
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

/** Candies in rows of ten, five to a group, so they can be counted. */
function Candies({ count, said }: { readonly count: number; readonly said: string }) {
  const gap = 10
  const columns = Math.min(CANDIES_A_ROW, count)
  const rows = Math.ceil(count / CANDIES_A_ROW)
  const width = columns * CANDY + (columns > 5 ? gap : 0)
  const height = rows * CANDY
  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
      height={height}
      role="img"
      aria-label={said}
    >
      {Array.from({ length: count }, (_, i) => {
        const column = i % CANDIES_A_ROW
        return (
          <circle
            key={i}
            cx={column * CANDY + (column >= 5 ? gap : 0) + CANDY / 2}
            cy={Math.floor(i / CANDIES_A_ROW) * CANDY + CANDY / 2}
            r={CANDY / 2 - 3}
            fill="#e8833a"
          />
        )
      })}
    </svg>
  )
}

/** Circles in rows and columns. */
function Grid({
  rows,
  columns,
  said,
}: {
  readonly rows: number
  readonly columns: number
  readonly said: string
}) {
  const step = CANDY + 8
  return (
    <svg
      viewBox={`0 0 ${String(columns * step)} ${String(rows * step)}`}
      width={columns * step}
      height={rows * step}
      role="img"
      aria-label={said}
    >
      {Array.from({ length: rows * columns }, (_, i) => (
        <circle
          key={i}
          cx={(i % columns) * step + step / 2}
          cy={Math.floor(i / columns) * step + step / 2}
          r={CANDY / 2 - 2}
          fill="#3f6fb5"
        />
      ))}
    </svg>
  )
}
