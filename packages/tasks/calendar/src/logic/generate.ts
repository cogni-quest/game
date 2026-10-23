import {
  chance,
  choiceAnswer,
  numberAnswer,
  pick,
  randomInt,
  type ChoiceAnswer,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { CalendarKnobs } from './knobs'

export const WEEKDAYS = [
  { value: 'monday', label: 'понедельник' },
  { value: 'tuesday', label: 'вторник' },
  { value: 'wednesday', label: 'среда' },
  { value: 'thursday', label: 'четверг' },
  { value: 'friday', label: 'пятница' },
  { value: 'saturday', label: 'суббота' },
  { value: 'sunday', label: 'воскресенье' },
] as const

export type Weekday = (typeof WEEKDAYS)[number]['value']

/** Each month: said after «в», and its days in an ordinary year. */
export const MONTHS = [
  { in: 'январе', days: 31 },
  { in: 'феврале', days: 28 },
  { in: 'марте', days: 31 },
  { in: 'апреле', days: 30 },
  { in: 'мае', days: 31 },
  { in: 'июне', days: 30 },
  { in: 'июле', days: 31 },
  { in: 'августе', days: 31 },
  { in: 'сентябре', days: 30 },
  { in: 'октябре', days: 31 },
  { in: 'ноябре', days: 30 },
  { in: 'декабре', days: 31 },
] as const

export const FEBRUARY = 1

export type CalendarPrompt =
  | {
      readonly ask: 'weekday'
      /** Index into WEEKDAYS. */
      readonly today: number
      /** Days forward, or back when negative; never zero. */
      readonly shift: number
    }
  | { readonly ask: 'month-days'; /** Index into MONTHS. */ readonly month: number }

export type CalendarAnswer = NumberAnswer | ChoiceAnswer<Weekday>
export type CalendarTask = Task<CalendarPrompt, CalendarAnswer>

export const PLUGIN_ID = 'calendar'

export function isCalendarTask(task: Task): task is CalendarTask {
  return task.pluginId === PLUGIN_ID
}

const OPTIONS = 4
const WEEK = WEEKDAYS.length
/** How often the question looks back: «какой день был 2 дня назад?». */
const BACK_SHARE = 1 / 3

export function generateCalendar({ ask }: CalendarKnobs, random: Random): CalendarTask {
  if (ask === 'month-days') {
    const month = randomInt(random, 0, MONTHS.length - 1)
    return {
      pluginId: PLUGIN_ID,
      itemKey: `cal:month-days:${String(month)}`,
      prompt: { ask, month },
      answer: numberAnswer(MONTHS[month]?.days ?? 0, 31),
    }
  }

  const today = randomInt(random, 0, WEEK - 1)
  const days = randomInt(random, 1, WEEK - 1)
  const shift = chance(random, BACK_SHARE) ? -days : days
  const right = (((today + shift) % WEEK) + WEEK) % WEEK
  const others = WEEKDAYS.map((_, i) => i).filter((i) => i !== right)
  const chosen = new Set([right])
  while (chosen.size < OPTIONS) chosen.add(pick(random, others))
  const options = WEEKDAYS.filter((_, i) => chosen.has(i))
  const expected = WEEKDAYS[right]?.value ?? 'monday'
  return {
    pluginId: PLUGIN_ID,
    itemKey: `cal:weekday:${String(today)}${shift > 0 ? '+' : ''}${String(shift)}`,
    prompt: { ask, today, shift },
    answer: choiceAnswer(expected, options),
  }
}
