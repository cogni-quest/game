import type { Task } from '@cogni/core'

import { isSudokuTask, MAGIC_SUM, sudokuPlugin } from '../logic'

const CELL = 72

/**
 * The grid, big: givens in dark figures, empty cells white, the asked cell
 * coloured with «?». A sudoku has thick lines around its 2×2 boxes.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isSudokuTask(task)) return null
  const { kind, size, cells } = task.prompt
  const side = size * CELL
  const box = kind === 'sudoku' ? 2 : size
  return (
    <figure className="sudoku-prompt">
      <figcaption>
        {kind === 'magic' && (
          <>
            В каждой строке, столбце и диагонали сумма {MAGIC_SUM}.
            <br />
          </>
        )}
        Какое число должно стоять в клетке со знаком вопроса?
      </figcaption>
      <svg
        viewBox={`-4 -4 ${String(side + 8)} ${String(side + 8)}`}
        width={side + 8}
        height={side + 8}
        role="img"
        aria-label={sudokuPlugin.speak(task)}
      >
        {cells.map((cell, at) => {
          const x = (at % size) * CELL
          const y = Math.floor(at / size) * CELL
          return (
            <g key={at}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={cell === 'asked' ? '#f7d9cf' : '#fff'}
                stroke="#8a8170"
                strokeWidth={1}
              />
              {cell !== 'blank' && (
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={40}
                  fontWeight={700}
                  fill={cell === 'asked' ? '#b5452b' : '#222'}
                >
                  {cell === 'asked' ? '?' : cell}
                </text>
              )}
            </g>
          )
        })}
        {Array.from({ length: size / box + 1 }, (_, i) => i * box * CELL).map((at) => (
          <g key={at}>
            <line x1={at} x2={at} y1={0} y2={side} stroke="#222" strokeWidth={4} />
            <line x1={0} x2={side} y1={at} y2={at} stroke="#222" strokeWidth={4} />
          </g>
        ))}
      </svg>
    </figure>
  )
}
