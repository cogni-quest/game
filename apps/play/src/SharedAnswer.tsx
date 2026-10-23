import { isChoiceAnswer, isNumberAnswer, isPickAnswer, type AnswerIO, type Task } from '@cogni/core'
import { useState } from 'react'

import { ChoiceButtons } from './ChoiceButtons'
import { NumberPad } from './NumberPad'
import { PickButtons } from './PickButtons'

/** The shared answer form for a task's shape — pad, buttons — for a game that cannot see the shape. */
export function SharedAnswer({ task, io }: { readonly task: Task; readonly io: AnswerIO }) {
  const [input, setInput] = useState('')
  const { answer } = task
  if (isNumberAnswer(answer)) {
    return (
      <NumberPad
        value={input}
        maxDigits={String(answer.upTo).length}
        disabled={io.disabled}
        onChange={setInput}
        onSubmit={() => {
          io.submit(Number(input))
          setInput('')
        }}
      />
    )
  }
  if (isChoiceAnswer(answer)) {
    return <ChoiceButtons options={answer.options} disabled={io.disabled} onChoose={io.submit} />
  }
  if (isPickAnswer(answer)) {
    return <PickButtons options={answer.options} disabled={io.disabled} onSubmit={io.submit} />
  }
  throw new Error(`No answer form for '${answer.shape}' yet`)
}
