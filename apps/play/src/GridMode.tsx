import { isChoiceAnswer, isPickAnswer, systemRandom, type Task } from '@cogni/core'
import type { CurriculumStep } from '@cogni/curriculum'
import { useState } from 'react'

import { registry, renderPrompt } from './registry'
import { formatLabel, LEVELS_SHOWN, levelContents, levelLabel, sectionLabel } from './variants'

/** The right answer as the child would see it: the number, or the option's label. */
function answerText(task: Task): string {
  const { answer } = task
  if (isChoiceAnswer(answer)) {
    return answer.options.find((o) => o.value === answer.expected)?.label ?? ''
  }
  if (isPickAnswer(answer)) {
    return answer.options
      .filter((o) => answer.expected.includes(o.value))
      .map((o) => o.label)
      .join(', ')
  }
  return String(answer.expected)
}

/** How many examples each cell shows. */
const PER_CELL = 3

type View = 'levels' | 'sections'

interface Cell {
  readonly caption: string
  readonly tasks: readonly Task[]
}

/** One row per format; one column per level or per section of the textbook. */
function sample(step: CurriculumStep, view: View): readonly (readonly (Cell | undefined)[])[] {
  const many = (make: () => Task) => Array.from({ length: PER_CELL }, make)
  return step.formats.map((format) =>
    view === 'levels'
      ? LEVELS_SHOWN.map((level) =>
          // A starred format is the boss's alone.
          format.stars !== undefined && level !== 'boss'
            ? undefined
            : {
                caption: levelContents(format, level),
                tasks: many(() => registry.generateLevel(format, level, systemRandom)),
              },
        )
      : format.sections.map((section, s) => ({
          caption: sectionLabel(section, s),
          tasks: many(() => registry.generateSection(format, s, systemRandom)),
        })),
  )
}

/**
 * Every format of the step, laid out by level (what the monsters get) or by
 * section (the textbook as written), a few examples each, with answers.
 */
export function GridMode({ step }: { readonly step: CurriculumStep }) {
  const [view, setView] = useState<View>('levels')
  const [rows, setRows] = useState(() => sample(step, view))
  const columns = Math.max(...rows.map((row) => row.length))

  /** Shows a view with fresh examples; pressing it again draws new ones. */
  const show = (next: View) => {
    setView(next)
    setRows(sample(step, next))
  }

  return (
    <section className="grid-mode">
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'levels'}
          onClick={() => {
            show('levels')
          }}
        >
          По уровням
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'sections'}
          onClick={() => {
            show('sections')
          }}
        >
          По разделам учебника
        </button>
      </div>
      <table className="grid">
        <thead>
          <tr>
            <th>Формат</th>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i}>
                {view === 'levels' ? levelLabel(LEVELS_SHOWN[i] ?? 1) : `Раздел ${String(i + 1)}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.formats.map((format, f) => (
            <tr key={formatLabel(format, f)}>
              <th>{formatLabel(format, f)}</th>
              {Array.from({ length: columns }, (_, i) => {
                const cell = rows[f]?.[i]
                return (
                  <td key={i}>
                    {cell === undefined ? (
                      <span className="empty">—</span>
                    ) : (
                      <>
                        <p className="knobs">{cell.caption}</p>
                        {cell.tasks.map((task, t) => (
                          <div key={`${task.itemKey}-${String(t)}`} className="example">
                            {renderPrompt(task)}
                            <span className="answer">→ {answerText(task)}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
