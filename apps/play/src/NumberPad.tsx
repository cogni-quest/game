const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const

export interface NumberPadProps {
  readonly value: string
  /** No more digits than the largest plausible answer has. */
  readonly maxDigits: number
  readonly disabled: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: () => void
}

/**
 * Big buttons, one press each — no precision and no speed asked of the hands.
 * Only the «Готово» button sends the answer.
 */
export function NumberPad({ value, maxDigits, disabled, onChange, onSubmit }: NumberPadProps) {
  return (
    <div className="pad">
      <output className="pad-field" aria-live="polite">
        {value === '' ? ' ' : value}
      </output>
      <div className="pad-keys">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled || value.length >= maxDigits}
            onClick={() => {
              onChange(value === '0' ? digit : value + digit)
            }}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || value === ''}
          onClick={() => {
            onChange(value.slice(0, -1))
          }}
          aria-label="Стереть"
        >
          ⌫
        </button>
      </div>
      <button
        type="button"
        className="pad-submit"
        disabled={disabled || value === ''}
        onClick={onSubmit}
      >
        Готово
      </button>
    </div>
  )
}
