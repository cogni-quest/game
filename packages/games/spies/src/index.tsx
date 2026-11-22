import type { GamePlugin } from '@cogni/core'
import type { ReactNode } from 'react'

import { CoverScene } from './Art'
import { GAME_ID, Spies, SUBJECT } from './Spies'

/** Secret agents: every mission is three houses, each spy found by reading a report. */
export const spiesGame: GamePlugin<ReactNode> = {
  id: GAME_ID,
  title: 'Секретные агенты',
  description: 'Прочитай донесение и найди окно шпиона: этаж, слева, справа',
  subject: SUBJECT,
  cover: () => <CoverScene />,
  render: (host) => <Spies host={host} />,
}
