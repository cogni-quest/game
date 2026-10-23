import {
  attemptPolicyFor,
  isChoiceAnswer,
  isNumberAnswer,
  isPickAnswer,
  startAttempts,
  systemRandom,
  type Attempts,
  type ChoiceAnswer,
  type NumberAnswer,
  type Outcome,
  type PickAnswer,
  type Task,
  type Level,
  type Tier,
} from '@cogni/core'
import type { CurriculumFormat, CurriculumStep } from '@cogni/curriculum'
import { useState } from 'react'

import { ChoiceButtons } from './ChoiceButtons'
import { NumberPad } from './NumberPad'
import { PickButtons } from './PickButtons'
import { hasOwnAnswer, registry, renderOwnAnswer, renderPrompt } from './registry'
import {
  formatLabel,
  levelContents,
  levelsOf,
  levelLabel,
  sectionLabel,
  TIERS,
  tierLabel,
} from './variants'

/**
 * Where the task comes from: as the game would ask it (any format, at a
 * monster's tier), one format at one level, or one exact section.
 */
type Source =
  | { readonly kind: 'tier'; readonly tier: Tier }
  | { readonly kind: 'level'; readonly format: number; readonly level: Level }
  | { readonly kind: 'section'; readonly format: number; readonly section: number }

/** A task with the answer form it needs: the pad for a number, buttons for a choice or a pick. */
type Round =
  | {
      readonly task: Task
      readonly form: 'number'
      readonly answer: NumberAnswer
      readonly attempts: Attempts<number>
    }
  | {
      readonly task: Task
      readonly form: 'choice'
      readonly answer: ChoiceAnswer
      readonly attempts: Attempts<string>
    }
  | {
      readonly task: Task
      readonly form: 'pick'
      readonly answer: PickAnswer
      readonly attempts: Attempts<readonly string[]>
    }
  | {
      readonly task: Task
      readonly form: 'own'
      readonly attempts: Attempts<unknown>
    }

function formatAt(step: CurriculumStep, index: number): CurriculumFormat {
  const format = step.formats[index]
  if (!format) throw new Error(`Step '${step.id}' has no format ${String(index + 1)}`)
  return format
}

function generate(step: CurriculumStep, source: Source): Task {
  switch (source.kind) {
    case 'tier':
      return registry.generate(step, source.tier, systemRandom)
    case 'level':
      return registry.generateLevel(formatAt(step, source.format), source.level, systemRandom)
    case 'section':
      return registry.generateSection(formatAt(step, source.format), source.section, systemRandom)
  }
}

function newRound(step: CurriculumStep, source: Source): Round {
  const task = generate(step, source)
  const { answer } = task
  const policy = attemptPolicyFor(step)
  if (hasOwnAnswer(task)) {
    return { task, form: 'own', attempts: startAttempts(answer, policy) }
  }
  if (isNumberAnswer(answer)) {
    return { task, form: 'number', answer, attempts: startAttempts(answer, policy) }
  }
  if (isChoiceAnswer(answer)) {
    return { task, form: 'choice', answer, attempts: startAttempts(answer, policy) }
  }
  if (isPickAnswer(answer)) {
    return { task, form: 'pick', answer, attempts: startAttempts(answer, policy) }
  }
  throw new Error(`No answer form for '${answer.shape}' yet`)
}

/** A source as one <select> value: «tier:3», «level:0:2», «section:1:4». */
function encode(source: Source): string {
  switch (source.kind) {
    case 'tier':
      return `tier:${String(source.tier)}`
    case 'level':
      return `level:${String(source.format)}:${String(source.level)}`
    case 'section':
      return `section:${String(source.format)}:${String(source.section)}`
  }
}

function decode(value: string): Source {
  const [kind, a = '', b = ''] = value.split(':')
  if (kind === 'tier') return { kind, tier: a === 'boss' ? 'boss' : (Number(a) as Tier) }
  if (kind === 'level') {
    return { kind, format: Number(a), level: b === 'boss' ? 'boss' : (Number(b) as Level) }
  }
  return { kind: 'section', format: Number(a), section: Number(b) }
}

/**
 * What the child is told the right answer was: the number, or the options'
 * labels. A plugin's own form shows it on its board instead.
 */
function revealed(round: Round): string | null {
  if (round.form === 'own') return null
  if (round.form === 'number') return String(round.answer.expected)
  const { options } = round.answer
  const expected: readonly string[] =
    round.form === 'pick' ? round.answer.expected : [round.answer.expected]
  return options
    .filter((o) => expected.includes(o.value))
    .map((o) => o.label)
    .join(', ')
}

export function SolveMode({ step }: { readonly step: CurriculumStep }) {
  const [source, setSource] = useState<Source>({ kind: 'tier', tier: 1 })
  const [round, setRound] = useState<Round>(() => newRound(step, source))
  const [input, setInput] = useState('')
  const [outcome, setOutcome] = useState<Outcome<unknown> | null>(null)

  const start = (next: Source) => {
    setSource(next)
    setRound(newRound(step, next))
    setInput('')
    setOutcome(null)
  }

  const record = (result: Outcome<unknown>) => {
    setOutcome(result)
    if (!result.final) setInput('')
  }

  const finished = outcome?.final ?? false

  return (
    <section className="solve">
      <label>
        Откуда задача:{' '}
        <select
          value={encode(source)}
          onChange={(event) => {
            start(decode(event.target.value))
          }}
        >
          <optgroup label="Как в игре — любой формат">
            {TIERS.map((tier) => (
              <option key={tier} value={encode({ kind: 'tier', tier })}>
                {tierLabel(tier)}
              </option>
            ))}
          </optgroup>
          {step.formats.map((format, f) => (
            <optgroup key={`level-${String(f)}`} label={`${formatLabel(format, f)} — по уровням`}>
              {levelsOf(format).map((level) => (
                <option key={level} value={encode({ kind: 'level', format: f, level })}>
                  {levelLabel(level)}: {levelContents(format, level)}
                </option>
              ))}
            </optgroup>
          ))}
          {step.formats.map((format, f) => (
            <optgroup
              key={`section-${String(f)}`}
              label={`${formatLabel(format, f)} — по разделам`}
            >
              {format.sections.map((section, s) => (
                <option
                  key={sectionLabel(section, s)}
                  value={encode({ kind: 'section', format: f, section: s })}
                >
                  раздел {s + 1}: {sectionLabel(section, s)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {renderPrompt(round.task)}
      <p className="item-key">{round.task.itemKey}</p>

      {round.form === 'own' ? (
        renderOwnAnswer(round.task, {
          disabled: finished,
          submit: (given) => {
            record(round.attempts.submit(given))
          },
          ...(outcome?.final === true ? { reveal: round.task.answer.expected } : {}),
        })
      ) : round.form === 'number' ? (
        <NumberPad
          value={input}
          maxDigits={String(round.answer.upTo).length}
          disabled={finished}
          onChange={setInput}
          onSubmit={() => {
            record(round.attempts.submit(Number(input)))
          }}
        />
      ) : round.form === 'pick' ? (
        <PickButtons
          key={round.task.itemKey}
          options={round.answer.options}
          disabled={finished}
          onSubmit={(values) => {
            record(round.attempts.submit(values))
          }}
        />
      ) : (
        <ChoiceButtons
          options={round.answer.options}
          disabled={finished}
          onChoose={(value) => {
            record(round.attempts.submit(value))
          }}
        />
      )}

      {outcome && <Verdict outcome={outcome} reveal={revealed(round)} />}

      {finished && (
        <button
          type="button"
          className="next"
          onClick={() => {
            start(source)
          }}
        >
          Дальше
        </button>
      )}
    </section>
  )
}

function Verdict({
  outcome,
  reveal,
}: {
  readonly outcome: Outcome<unknown>
  readonly reveal: string | null
}) {
  if (outcome.verdict === 'correct') return <p className="verdict correct">Верно!</p>
  if (!outcome.final) return <p className="verdict wrong">Попробуй ещё раз</p>
  if (reveal === null) return <p className="verdict wrong">Правильный ответ — на поле</p>
  return (
    <p className="verdict wrong">
      Правильный ответ: <strong>{reveal}</strong>
    </p>
  )
}
