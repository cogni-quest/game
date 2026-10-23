import { useEffect, useState } from 'react'

import { GAMES, host, SHOP_URL } from './games'
import { pathOf } from './routes'

/**
 * The child's door: the games as big cards, and in the top bar the coins with
 * the way to the shop, which is not a game and so not a card. A launcher
 * rather than a playroom — the child is nearly nine. A game still
 * being built shows as «в разработке», so the menu says what is coming
 * without a dead link.
 */
export function Menu({ base }: { readonly base: string }) {
  const [coins, setCoins] = useState(() => host.coins())
  useEffect(() => host.onCoins(setCoins), [])

  return (
    <main className="menu">
      <header className="menu-bar">
        <span className="menu-brand">
          Cogni <b>Quest</b>
        </span>
        {/* Coins and where they are spent, together: the shop is not a game. */}
        <span className="menu-wallet">
          <span className="menu-coins" aria-label={`Монеты: ${String(coins)}`}>
            <Coin /> {coins}
          </span>
          <a className="menu-shop" href={SHOP_URL}>
            <ChestIcon />
            Лавка чудес
          </a>
        </span>
      </header>

      <h1 className="menu-title">Выбери игру</h1>

      <nav className="menu-cards" aria-label="Игры">
        {GAMES.map((game) => (
          <a key={game.id} className="menu-card" href={pathOf({ page: 'game', id: game.id }, base)}>
            <span className="menu-card-art">{game.cover()}</span>
            <span className="menu-card-text">
              <span className="menu-card-title">{game.title}</span>
              <span className="menu-card-line">{game.description}</span>
            </span>
          </a>
        ))}

        <span className="menu-card locked" aria-disabled="true">
          <span className="menu-card-art">
            <ShieldIcon />
          </span>
          <span className="menu-card-text">
            <span className="menu-card-title">Kings Bounty</span>
            <span className="menu-card-line">Собери армию и одолей монстров</span>
          </span>
          <span className="menu-card-badge">в разработке</span>
        </span>
      </nav>
    </main>
  )
}

function Coin() {
  return (
    <svg className="menu-coin" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx={12} cy={12} r={10} fill="#e8b630" stroke="#a87f12" strokeWidth={2} />
      <circle cx={12} cy={12} r={5.5} fill="none" stroke="#a87f12" strokeWidth={1.5} />
    </svg>
  )
}

/** Kings Bounty: a shield with two crossed swords behind it. */
function ShieldIcon() {
  return (
    <svg viewBox="0 0 120 100" className="menu-icon" aria-hidden="true">
      {[-1, 1].map((side) => (
        <g key={side} transform={`rotate(${String(side * 40)} 60 52)`}>
          <rect x={57} y={6} width={6} height={64} rx={2} fill="#c9ced8" />
          <rect x={46} y={66} width={28} height={6} rx={3} fill="#8a6a3a" />
          <rect x={57} y={72} width={6} height={14} rx={2} fill="#5b4226" />
        </g>
      ))}
      <path
        d="M 60 18 L 86 28 Q 86 66 60 84 Q 34 66 34 28 Z"
        fill="#3a4a8a"
        stroke="#e8b630"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M 60 34 L 64 46 L 76 46 L 66 53 L 70 65 L 60 57 L 50 65 L 54 53 L 44 46 L 56 46 Z"
        fill="#e8b630"
      />
    </svg>
  )
}

/** Лавка чудес: an open chest with light coming out of it. */
function ChestIcon() {
  return (
    <svg viewBox="0 0 120 100" className="menu-icon" aria-hidden="true">
      <ellipse cx={60} cy={34} rx={40} ry={22} fill="rgba(255, 224, 138, 0.18)" />
      {[
        [38, 14, 5],
        [62, 6, 7],
        [84, 16, 4.5],
      ].map(([x = 0, y = 0, r = 0]) => (
        <path
          key={x}
          d={`M ${String(x)} ${String(y - r)} Q ${String(x)} ${String(y)} ${String(x + r)} ${String(y)} Q ${String(x)} ${String(y)} ${String(x)} ${String(y + r)} Q ${String(x)} ${String(y)} ${String(x - r)} ${String(y)} Q ${String(x)} ${String(y)} ${String(x)} ${String(y - r)} Z`}
          fill="#ffe08a"
        />
      ))}
      <path
        d="M 26 46 Q 26 26 60 26 Q 94 26 94 46 Z"
        fill="#7a4a24"
        stroke="#4a2c12"
        strokeWidth={3}
        transform="rotate(-14 26 46)"
      />
      <rect
        x={24}
        y={46}
        width={72}
        height={40}
        rx={5}
        fill="#8b5a2b"
        stroke="#4a2c12"
        strokeWidth={3}
      />
      <rect x={24} y={56} width={72} height={6} fill="#e8b630" />
      <rect
        x={54}
        y={52}
        width={12}
        height={16}
        rx={2}
        fill="#e8b630"
        stroke="#a87f12"
        strokeWidth={2}
      />
      <circle cx={42} cy={44} r={5} fill="#ffe08a" />
      <circle cx={60} cy={41} r={6} fill="#ffe08a" />
      <circle cx={77} cy={44} r={5} fill="#ffe08a" />
    </svg>
  )
}
