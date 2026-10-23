import {
  chance,
  choiceAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { Ask, AnglesKnobs } from './knobs'

export type Answer = 'yes' | 'no' | '1' | '2' | '3'

export interface Angle {
  readonly degrees: number
  /** Where the first ray points, in degrees counted from «east», anticlockwise. */
  readonly turn: number
}

export interface AnglesPrompt {
  readonly ask: Ask
  readonly angles: readonly Angle[]
}

export type AnglesTask = Task<AnglesPrompt, ChoiceAnswer<Answer>>

export const PLUGIN_ID = 'angles'

export function isAnglesTask(task: Task): task is AnglesTask {
  return task.pluginId === PLUGIN_ID
}

export const RIGHT = 90

const YES_NO = [
  { value: 'yes', label: 'да' },
  { value: 'no', label: 'нет' },
] as const

const NUMBERED = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
] as const

/** Angles that are not right, every five degrees. */
function notRight(near: boolean): number[] {
  const [sharp, blunt] = near
    ? [
        [70, 80],
        [100, 110],
      ]
    : [
        [30, 60],
        [120, 150],
      ]
  const degrees: number[] = []
  for (const [from = 0, to = 0] of [sharp, blunt]) {
    for (let d = from; d <= to; d += 5) degrees.push(d)
  }
  return degrees
}

export function generateAngles({ ask, near }: AnglesKnobs, random: Random): AnglesTask {
  const others = notRight(near === true)
  const angle = (degrees: number): Angle => ({ degrees, turn: randomInt(random, 0, 71) * 5 })

  if (ask === 'is-right') {
    const right = chance(random, 0.5)
    const degrees = right ? RIGHT : pick(random, others)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `angle:is-right:${String(degrees)}`,
      prompt: { ask, angles: [angle(degrees)] },
      answer: choiceAnswer<Answer>(right ? 'yes' : 'no', YES_NO),
    }
  }

  const at = randomInt(random, 0, 2)
  const first = pick(random, others)
  const second = pick(
    random,
    others.filter((d) => d !== first),
  )
  const rest = [first, second]
  const degrees = [0, 1, 2].map((i) => (i === at ? RIGHT : (rest.shift() ?? first)))
  return {
    pluginId: PLUGIN_ID,
    itemKey: `angle:which:${degrees.join(',')}`,
    prompt: { ask, angles: degrees.map(angle) },
    answer: choiceAnswer<Answer>(String(at + 1) as Answer, NUMBERED),
  }
}
