import {
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { ClockKnobs, Step } from './knobs'

export interface ClockPrompt {
  /** 1…12. */
  readonly hours: number
  readonly minutes: number
}

export type ClockTask = Task<ClockPrompt, ChoiceAnswer>

export const PLUGIN_ID = 'clock'

export function isClockTask(task: Task): task is ClockTask {
  return task.pluginId === PLUGIN_ID
}

const MINUTES: Record<Step, readonly number[]> = {
  hour: [0],
  half: [30],
  quarter: [15, 45],
  five: [5, 10, 20, 25, 35, 40, 50, 55],
}

const OPTIONS = 4

/** «3:05». */
export function written(hours: number, minutes: number): string {
  return `${String(hours)}:${String(minutes).padStart(2, '0')}`
}

/**
 * Where the hands point, in degrees clockwise from twelve. The hour hand moves
 * on between the numbers as the minutes pass: at 3:30 it is halfway to four.
 */
export function handAngles({ hours, minutes }: ClockPrompt): {
  readonly hour: number
  readonly minute: number
} {
  return { hour: ((hours % 12) + minutes / 60) * 30, minute: minutes * 6 }
}

export function generateClock({ step }: ClockKnobs, random: Random): ClockTask {
  const hours = randomInt(random, 1, 12)
  const minutes = pick(random, MINUTES[step])
  const right = written(hours, minutes)
  const wrong = [...new Set(mistakes(hours, minutes))].filter((t) => t !== right)
  const chosen = shuffle(wrong, random).slice(0, OPTIONS - 1)
  const options = shuffle([right, ...chosen], random).map((t) => ({ value: t, label: t }))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `clock:${right}`,
    prompt: { hours, minutes },
    answer: choiceAnswer(right, options),
  }
}

/** The readings a child gets wrong: an hour off, the hands swapped, the half or quarter mixed up. */
function mistakes(hours: number, minutes: number): string[] {
  const wrap = (h: number) => ((h + 11) % 12) + 1
  const mark = minutes === 0 ? 12 : minutes / 5
  return [
    written(wrap(hours + 1), minutes),
    written(wrap(hours - 1), minutes),
    written(mark, (hours * 5) % 60),
    written(hours, (minutes + 30) % 60),
    written(hours, (60 - minutes) % 60),
  ]
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i)
    const a = result[i] as T
    result[i] = result[j] as T
    result[j] = a
  }
  return result
}
