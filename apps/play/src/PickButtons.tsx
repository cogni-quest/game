import type { ChoiceOption } from '@cogni/core'
import { useState } from 'react'

export interface PickButtonsProps {
  readonly options: readonly ChoiceOption<string>[]
  readonly disabled: boolean
  readonly onSubmit: (values: readonly string[]) => void
}

/**
 * Big buttons that stay pressed, then «Готово» — a slip of the hand is undone
 * by pressing again, and nothing counts until the child says it is done.
 */
export function PickButtons({ options, disabled, onSubmit }: PickButtonsProps) {
  const [chosen, setChosen] = useState<readonly string[]>([])
  return (
    <div className="pick">
      <div className="choices">
        {options.map((option) => {
          const on = chosen.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              className={on ? 'picked' : undefined}
              disabled={disabled}
              onClick={() => {
                setChosen(on ? chosen.filter((v) => v !== option.value) : [...chosen, option.value])
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="done"
        disabled={disabled || chosen.length === 0}
        onClick={() => {
          onSubmit(chosen)
          setChosen([])
        }}
      >
        Готово
      </button>
    </div>
  )
}
