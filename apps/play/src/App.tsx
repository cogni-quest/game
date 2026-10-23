import { allSteps, logicPeterson, mathMoro, type CurriculumStep } from '@cogni/curriculum'
import { useState } from 'react'

import { GridMode } from './GridMode'
import { SolveMode } from './SolveMode'

const STEPS = [...allSteps(mathMoro), ...allSteps(logicPeterson)]

/** The grades the curriculum covers, in order, to group the step picker by. */
const GRADES = [...new Set(mathMoro.topics.map((t) => t.grade))].filter((g) => g !== undefined)

type Mode = 'solve' | 'grid'

function firstStep(): CurriculumStep {
  const step = STEPS[0]
  if (!step) throw new Error('The curriculum has no steps')
  return step
}

/**
 * The test stand: pick a step, then either solve its tasks one by one at a
 * chosen format and level, or see every format at every level at once.
 */
export function App() {
  const [step, setStep] = useState<CurriculumStep>(firstStep)
  const [mode, setMode] = useState<Mode>('solve')

  return (
    <main className="app">
      <header className="toolbar">
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
            <optgroup label="Логика">
              {allSteps(logicPeterson).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'solve'}
            onClick={() => {
              setMode('solve')
            }}
          >
            Решать
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'grid'}
            onClick={() => {
              setMode('grid')
            }}
          >
            Всё сразу
          </button>
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
