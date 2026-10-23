import type { GameHost, Outcome, Task, Tier } from '@cogni/core'
import { useEffect, useState, type ReactNode } from 'react'

import { CaughtScene, CopPortrait, EscapeScene, HidingScene, ThiefPortrait } from './Art'
import { afterCatch, isOpen, readProgress, THIEVES, type Progress, type Thief } from './thieves'
import './detective.css'

/** Its tasks: memory and attention, whichever topic of it the core chooses. */
export const SUBJECT = 'attention'

export const GAME_ID = 'detective'

/** How strong the thief is, as the wanted poster says it. */
function strength(tier: Tier): string {
  return tier === 'boss' ? '👑' : '★'.repeat(tier)
}

function caseFor(host: GameHost<ReactNode>, tier: Tier): Task {
  const [task] = host.requestTasks({ count: 1, tier, subject: SUBJECT })
  if (!task) throw new Error('The host gave no task for the case')
  return task
}

/** The case in hand: whom the child chose to chase, and the trail to follow. */
interface Chase {
  readonly thief: Thief
  readonly task: Task
}

/**
 * The detective. It opens on the wanted board: the child picks whom to chase
 * among the thieves opened so far; catching the strongest open one opens the
 * next. Then one case is one thief and one task.
 */
export function Detective({ host }: { readonly host: GameHost<ReactNode> }) {
  const [progress, setProgress] = useState<Progress>(() =>
    readProgress(host.loadGameState(GAME_ID)),
  )
  const [chase, setChase] = useState<Chase | null>(null)
  const [number, setNumber] = useState(0)
  const [coins, setCoins] = useState(() => host.coins())

  useEffect(() => host.onCoins(setCoins), [host])

  const start = (thief: Thief) => {
    setChase({ thief, task: caseFor(host, thief.tier) })
    setNumber(number + 1)
  }

  const caught = (tier: Tier): Thief | null => {
    host.encounterWon(tier)
    const next = afterCatch(progress, tier)
    if (next === progress) return null
    setProgress(next)
    host.saveGameState(GAME_ID, next)
    return THIEVES[next.opened - 1] ?? null
  }

  return (
    <section className="detective">
      <header className="detective-header">
        <span className="detective-case">
          {chase ? `Дело №${String(number)}` : 'Доска розыска'}
        </span>
        <span className="detective-coins" aria-label={`Монеты: ${String(coins)}`}>
          <span className="detective-coin" aria-hidden="true">
            🪙
          </span>
          {/* A new key on every change replays the bump. */}
          <span key={coins} className="detective-coins-count">
            {coins}
          </span>
        </span>
      </header>

      {chase ? (
        <Case
          key={number}
          host={host}
          chase={chase}
          onCaught={caught}
          onAgain={() => {
            start(chase.thief)
          }}
          onBoard={() => {
            setChase(null)
          }}
        />
      ) : (
        <WantedBoard host={host} progress={progress} onPick={start} />
      )}
    </section>
  )
}

/** Every thief on a poster; the ones not yet opened are a dark shape and a padlock. */
function WantedBoard({
  host,
  progress,
  onPick,
}: {
  readonly host: GameHost<ReactNode>
  readonly progress: Progress
  readonly onPick: (thief: Thief) => void
}) {
  return (
    <div className="detective-wanted-board">
      <div className="detective-board-hero">
        <CopPortrait mood="look" />
        <p className="detective-bubble">Кого ловим? Чем сильнее вор, тем больше награда.</p>
      </div>
      <ul className="detective-posters">
        {THIEVES.map((thief, i) => {
          const open = isOpen(progress, thief.tier)
          const before = THIEVES[i - 1]
          return (
            <li key={String(thief.tier)}>
              <button
                type="button"
                className={`detective-wanted poster ${open ? '' : 'locked'}`}
                disabled={!open}
                onClick={() => {
                  onPick(thief)
                }}
              >
                <span className="detective-wanted-label">Разыскивается</span>
                <ThiefPortrait hat={thief.hat} boss={thief.tier === 'boss'} />
                <span className="detective-wanted-name">{thief.name}</span>
                <span className="detective-wanted-stars" aria-label={`сила ${String(thief.tier)}`}>
                  {strength(thief.tier)}
                </span>
                {open || !before ? (
                  <span className="detective-wanted-reward">
                    Награда: {host.coinsFor(thief.tier)} <span aria-hidden="true">🪙</span>
                  </span>
                ) : (
                  <>
                    <span className="detective-lock" aria-hidden="true">
                      🔒
                    </span>
                    <span className="detective-wanted-reward">Сначала поймай: {before.name}</span>
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One case: the trail, the board, and the verdict beside it. */
function Case({
  host,
  chase,
  onCaught,
  onAgain,
  onBoard,
}: {
  readonly host: GameHost<ReactNode>
  readonly chase: Chase
  /** Pays for the catch; returns the thief it opened, if any. */
  readonly onCaught: (tier: Tier) => Thief | null
  readonly onAgain: () => void
  readonly onBoard: () => void
}) {
  const { thief, task } = chase
  const [outcome, setOutcome] = useState<Outcome<unknown> | null>(null)
  const [opened, setOpened] = useState<Thief | null>(null)

  const reward = host.coinsFor(thief.tier)
  const finished = outcome?.final ?? false
  const caught = outcome?.verdict === 'correct'
  const escaped = finished && !caught

  // Silent by the parent's choice: the steps are read off the arrows.
  const submit = (given: unknown) => {
    const result = host.submit(task, given, 'tap')
    setOutcome(result)
    if (result.verdict === 'correct') setOpened(onCaught(thief.tier))
  }

  const says = caught
    ? 'Попался, голубчик!'
    : escaped
      ? 'Эх, ушёл! Смотри, как он бежал.'
      : outcome
        ? 'Тут пусто. Поищи ещё!'
        : 'Иди по следам, раскрашивай клетки. Нашёл — жми «Здесь!»'

  return (
    <div className="detective-play">
      <aside className="detective-hero">
        <p className="detective-bubble">{says}</p>
        <CopPortrait mood={caught ? 'cheer' : escaped ? 'sigh' : 'look'} />
      </aside>

      <div className="detective-board">
        {host.renderPrompt(task)}
        {host.renderAnswer(task, {
          disabled: finished,
          submit,
          ...(outcome?.reveal === undefined ? {} : { reveal: outcome.reveal }),
        })}
      </div>

      {/* The poster and the verdict sit beside the board, so they show without scrolling. */}
      <div className="detective-side">
        {!finished && (
          <div className="detective-wanted">
            <span className="detective-wanted-label">Разыскивается</span>
            <ThiefPortrait hat={thief.hat} boss={thief.tier === 'boss'} />
            <span className="detective-wanted-name">{thief.name}</span>
            <span className="detective-wanted-stars" aria-label={`сила ${String(thief.tier)}`}>
              {strength(thief.tier)}
            </span>
            <span className="detective-wanted-reward">
              Награда: {reward} <span aria-hidden="true">🪙</span>
            </span>
          </div>
        )}

        {caught ? (
          <div className="detective-verdict caught" role="status">
            <CaughtScene hat={thief.hat} />
            <span className="detective-flying-coin" aria-hidden="true">
              +{reward} 🪙
            </span>
            <strong>Попался!</strong>
            <span>Награда в копилку: {reward} 🪙</span>
          </div>
        ) : escaped ? (
          <div className="detective-verdict escaped" role="status">
            <EscapeScene hat={thief.hat} />
            <strong>Убежал!</strong>
            <span>Зелёный след — его путь</span>
          </div>
        ) : (
          <div className="detective-verdict waiting">
            <HidingScene hat={thief.hat} />
            <span>Где-то прячется…</span>
          </div>
        )}

        {opened && (
          <p className="detective-opened" role="status">
            🔓 На доске новый вор: <strong>{opened.name}</strong>
          </p>
        )}

        {finished && (
          <div className="detective-after">
            <button type="button" className="detective-next" onClick={onAgain}>
              {caught ? 'Ловить ещё' : 'Ловить снова'}
            </button>
            <button type="button" className="detective-next secondary" onClick={onBoard}>
              К доске розыска
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
