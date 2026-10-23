import { z } from 'zod'

/**
 * One section of «сутки, месяц, год»:
 *
 * - `weekday` — «Сегодня вторник. Какой день недели будет через 3 дня?»,
 *   sometimes «…был 2 дня назад?»; answered by choosing the day;
 * - `month-days` — «Сколько дней в апреле?», answered with a number.
 */
export const calendarKnobs = z.strictObject({
  ask: z.enum(['weekday', 'month-days']),
})

export type CalendarKnobs = z.infer<typeof calendarKnobs>
