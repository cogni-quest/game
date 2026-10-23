import type { GamePlugin } from '@cogni/core'
import type { ReactNode } from 'react'

import { CoverScene } from './Art'
import { Detective, GAME_ID, SUBJECT } from './Detective'

/** The detective: every case is one thief, caught by where his trail ends. */
export const detectiveGame: GamePlugin<ReactNode> = {
  id: GAME_ID,
  title: 'Детектив',
  description: 'Иди по следам и найди, где спрятался вор',
  subject: SUBJECT,
  cover: () => <CoverScene />,
  render: (host) => <Detective host={host} />,
}
