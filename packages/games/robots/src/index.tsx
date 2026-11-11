import type { GamePlugin } from '@cogni/core'
import type { ReactNode } from 'react'

import { CoverScene } from './Art'
import { GAME_ID, Robots, SUBJECT } from './Robots'

/** The robot workshop: every robot is three programs, loaded by repeating their lights. */
export const robotsGame: GamePlugin<ReactNode> = {
  id: GAME_ID,
  title: 'Робо-мастерская',
  description: 'Запомни, как мигают огоньки, и собери робота',
  subject: SUBJECT,
  cover: () => <CoverScene />,
  render: (host) => <Robots host={host} />,
}
