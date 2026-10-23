import { counted, defineTaskPlugin } from '@cogni/core'

import {
  FEBRUARY,
  generateCalendar,
  MONTHS,
  PLUGIN_ID,
  WEEKDAYS,
  type CalendarAnswer,
  type CalendarPrompt,
} from './generate'
import { calendarKnobs, type CalendarKnobs } from './knobs'

export const calendarPlugin = defineTaskPlugin<CalendarKnobs, CalendarPrompt, CalendarAnswer>({
  id: PLUGIN_ID,
  parseKnobs: (raw) => calendarKnobs.parse(raw),
  generate: (knobs, random) => generateCalendar(knobs, random),
  speak: ({ prompt }) => {
    if (prompt.ask === 'month-days') {
      const ordinary = prompt.month === FEBRUARY ? ' в обычном году' : ''
      return `Сколько дней в ${MONTHS[prompt.month]?.in ?? ''}${ordinary}?`
    }
    const today = WEEKDAYS[prompt.today]?.label ?? ''
    const days = counted(Math.abs(prompt.shift), ['день', 'дня', 'дней'])
    return prompt.shift > 0
      ? `Сегодня ${today}. Какой день недели будет через ${days}?`
      : `Сегодня ${today}. Какой день недели был ${days} назад?`
  },
})
