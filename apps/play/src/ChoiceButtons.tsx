import type { ChoiceOption } from '@cogni/core'

export interface ChoiceButtonsProps {
  readonly options: readonly ChoiceOption<string>[]
  readonly disabled: boolean
  readonly onChoose: (value: string) => void
}

/** Two to four big buttons — one press answers, no precision asked of the hands. */
export function ChoiceButtons({ options, disabled, onChoose }: ChoiceButtonsProps) {
  return (
    <div className="choices">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => {
            onChoose(option.value)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
