import {
  allSteps,
  attention,
  logicPeterson,
  mathMoro,
  type CurriculumStep,
} from '@cogni/curriculum'
import { useState } from 'react'

import { GridMode } from './GridMode'
import { pathOf } from './routes'
import { SolveMode } from './SolveMode'

const STEPS = [...allSteps(mathMoro), ...allSteps(logicPeterson), ...allSteps(attention)]

/** The grades the curriculum covers, in order, to group the step picker by. */
const GRADES = [...new Set(mathMoro.topics.map((t) => t.grade))].filter((g) => g !== undefined)

/** The branches beside the school years, each its own group of the picker. */
const BRANCHES = [
  { label: 'Логика', graph: logicPeterson },
  { label: 'Память и внимание', graph: attention },
] as const

type Mode = 'solve' | 'grid'

function firstStep(): CurriculumStep {
  const step = STEPS[0]
  if (!step) throw new Error('The curriculum has no steps')
  return step
}

/**
 * The test stand, behind `/test` and `/admin`: pick a step, then either solve
 * its tasks one by one at a chosen format and level, or see every format at
 * every level at once — before the child ever meets them.
 */
export function Stand({ base }: { readonly base: string }) {
  const [step, setStep] = useState<CurriculumStep>(firstStep)
  const [mode, setMode] = useState<Mode>('solve')

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => {
        setMode(value)
      }}
    >
      {label}
    </button>
  )

  return (
    <main className="app">
      <header className="toolbar">
        <a className="back" href={pathOf({ page: 'menu' }, base)}>
          ← К играм
        </a>
        <label>
          Шаг:{' '}
          <select
            value={step.id}
            onChange={(event) => {
              const chosen = STEPS.find((s) => s.id === event.target.value)
              if (chosen) setStep(chosen)
            }}
          >
            {GRADES.map((grade) => (
              <optgroup key={grade} label={`${String(grade)} класс`}>
                {mathMoro.topics
                  .filter((t) => t.grade === grade)
                  .flatMap((t) => t.steps)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.title}
                    </option>
                  ))}
              </optgroup>
            ))}
            {BRANCHES.map(({ label, graph }) => (
              <optgroup key={label} label={label}>
                {allSteps(graph).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="tabs" role="tablist">
          {tab('solve', 'Решать')}
          {tab('grid', 'Всё сразу')}
        </div>
      </header>

      {/* A new key resets the mode's state whenever the step changes. */}
      {mode === 'solve' ? (
        <SolveMode key={step.id} step={step} />
      ) : (
        <GridMode key={step.id} step={step} />
      )}
    </main>
  )
}
