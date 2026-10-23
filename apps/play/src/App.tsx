import { GamePage } from './GamePage'
import { GAMES } from './games'
import { Menu } from './Menu'
import { routeOf } from './routes'
import { Stand } from './Stand'

const BASE = import.meta.env.BASE_URL

/** The page for the address: the menu, a game, or the stand behind `/test` and `/admin`. */
export function App() {
  const route = routeOf(
    window.location.pathname,
    BASE,
    GAMES.map((g) => g.id),
  )
  switch (route.page) {
    case 'menu':
    case 'missing':
      return <Menu base={BASE} />
    case 'stand':
      return <Stand base={BASE} />
    case 'game': {
      const game = GAMES.find((g) => g.id === route.id)
      return game ? <GamePage game={game} base={BASE} /> : <Menu base={BASE} />
    }
  }
}
