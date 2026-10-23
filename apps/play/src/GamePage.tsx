import type { GamePlugin } from '@cogni/core'
import type { ReactNode } from 'react'

import { host } from './games'
import { pathOf } from './routes'

/** One game on its own page, with the way back to the menu. */
export function GamePage({
  game,
  base,
}: {
  readonly game: GamePlugin<ReactNode>
  readonly base: string
}) {
  return (
    <main className="app game-page">
      <a className="back" href={pathOf({ page: 'menu' }, base)}>
        ← Игры
      </a>
      {game.render(host)}
    </main>
  )
}
