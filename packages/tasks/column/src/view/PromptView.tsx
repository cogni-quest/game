import type { Task } from '@cogni/core'

import { columnPlugin, isColumnTask, resultOf } from '../logic'

/**
 * The example as in a squared exercise book: digits right-aligned one per
 * cell, the sign on the left, a line, and empty cells for the answer.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isColumnTask(task)) return null
  const { op, a, b } = task.prompt
  const answerDigits = String(resultOf(task.prompt)).length
  const width = Math.max(String(a).length, String(b).length, answerDigits)
  const rows: { sign: string; cells: string[]; className: string }[] = [
    { sign: '', cells: padded(String(a), width), className: 'column-row' },
    {
      sign: op === 'add' ? '+' : '−',
      cells: padded(String(b), width),
      className: 'column-row column-line',
    },
    {
      sign: '',
      cells: padded('□'.repeat(answerDigits), width),
      className: 'column-row column-answer',
    },
  ]
  return (
    <figure className="column-prompt" aria-label={columnPlugin.speak(task)}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${String(width + 1)}, 1.1em)`,
          fontFamily: 'ui-monospace, monospace',
          textAlign: 'center',
        }}
      >
        {rows.map((row, r) =>
          [row.sign, ...row.cells].map((cell, c) => (
            <span
              key={`${String(r)}:${String(c)}`}
              className={`column-cell ${row.className}`}
              style={r === 1 && c > 0 ? { borderBottom: '0.08em solid currentColor' } : undefined}
            >
              {cell}
            </span>
          )),
        )}
      </div>
    </figure>
  )
}

/** The digits pushed to the right of `width` cells. */
function padded(digits: string, width: number): string[] {
  const blank = width - digits.length
  return Array.from({ length: width }, (_, i) => (i < blank ? '' : digits.charAt(i - blank)))
}
