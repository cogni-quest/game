import type { GameHost, Outcome, Task, Tier } from '@cogni/core'
import { useEffect, useState, type ReactNode } from 'react'

import { Owl, SpyPortrait, Stars, type OwlMood } from './Art'
import {
  afterMission,
  HOUSES,
  isOpen,
  MISSIONS,
  readProgress,
  shown,
  tipFor,
  type Mission,
  type Progress,
} from './missions'
import { isSound, play, type Sound } from './sounds'
import './spies.css'

/** Its tasks: finding one's way in space, whichever topic of it the core chooses. */
export const SUBJECT = 'space'

export const GAME_ID = 'spies'

/** Where the host keeps whether the agency's sounds are off. */
const SOUND_ID = 'spies-sound'

function readMuted(stored: unknown): boolean {
  return typeof stored === 'object' && stored !== null && 'muted' in stored && stored.muted === true
}

/** How hard the mission's reports are, as its card says it. */
function strength(tier: Tier): string {
  return tier === 'boss' ? '👑' : '★'.repeat(tier)
}

/** A house row's mark: caught, got away, searching now, still to come. */
const MARK = { done: '✔', failed: '✖', now: '▶', todo: '○' } as const

function reportFor(host: GameHost<ReactNode>, tier: Tier): Task {
  const [task] = host.requestTasks({ count: 1, tier, subject: SUBJECT })
  if (!task) throw new Error('The host gave no task for the house')
  return task
}

/**
 * The agency. It opens on the headquarters: the child picks a mission among
 * those opened so far. A mission is a briefing and then three houses, each
 * with a report — catch the spy in his window; a spy who gets away ends the
 * mission. Completing the hardest open mission opens the next.
 */
export function Spies({ host }: { readonly host: GameHost<ReactNode> }) {
  const [progress, setProgress] = useState<Progress>(() =>
    readProgress(host.loadGameState(GAME_ID)),
  )
  const [mission, setMission] = useState<Mission | null>(null)
  const [number, setNumber] = useState(0)
  const [coins, setCoins] = useState(() => host.coins())
  const [muted, setMuted] = useState(() => readMuted(host.loadGameState(SOUND_ID)))

  useEffect(() => host.onCoins(setCoins), [host])

  const sound = (which: Sound) => {
    play(which, muted)
  }

  const start = (chosen: Mission) => {
    sound('pick')
    setMission(chosen)
    setNumber(number + 1)
  }

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    host.saveGameState(SOUND_ID, { muted: next })
    if (!next) play('choose', false)
  }

  const completed = (tier: Tier): Mission | null => {
    host.encounterWon(tier)
    const next = afterMission(progress, tier)
    if (next === progress) return null
    setProgress(next)
    host.saveGameState(GAME_ID, next)
    return MISSIONS[next.opened - 1] ?? null
  }

  return (
    <section className="spies">
      <header className="spies-header">
        <span className="spies-title">
          {mission ? `Миссия «${mission.codename}»` : 'Секретные агенты'}
        </span>
        <button
          type="button"
          className={`spies-sound ${muted ? 'off' : 'on'}`}
          aria-pressed={!muted}
          aria-label={muted ? 'Включить звуки' : 'Выключить звуки'}
          onClick={toggleSound}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <span className="spies-coins" aria-label={`Монеты: ${String(coins)}`}>
          <span aria-hidden="true">🪙</span>
          <span key={coins} className="spies-coins-count">
            {coins}
          </span>
        </span>
      </header>

      {mission ? (
        <Operation
          key={number}
          host={host}
          mission={mission}
          number={number}
          onCompleted={completed}
          onAgain={() => {
            start(mission)
          }}
          onBoard={() => {
            setMission(null)
          }}
          sound={sound}
        />
      ) : (
        <Headquarters host={host} progress={shown(progress, location.search)} onPick={start} />
      )}
    </section>
  )
}

/** Every mission as a dossier; the ones not yet opened are a dark shape under a padlock. */
function Headquarters({
  host,
  progress,
  onPick,
}: {
  readonly host: GameHost<ReactNode>
  readonly progress: Progress
  readonly onPick: (mission: Mission) => void
}) {
  return (
    <div className="spies-board">
      <div className="spies-board-hero">
        <Owl mood="think" />
        <p className="spies-bubble">
          Я агент Сова, ночью вижу всё. В городе прячутся шпионы. Выбирай миссию: в каждой — три
          дома и три донесения.
        </p>
      </div>
      <ul className="spies-cards">
        {MISSIONS.map((m, i) => {
          const open = isOpen(progress, m.tier)
          const before = MISSIONS[i - 1]
          return (
            <li key={String(m.tier)}>
              <button
                type="button"
                className={`spies-card ${open ? '' : 'locked'}`}
                disabled={!open}
                onClick={() => {
                  onPick(m)
                }}
              >
                <span className="spies-card-stamp" aria-hidden="true">
                  Совершенно секретно
                </span>
                <SpyPortrait mission={m} locked={!open} />
                <span className="spies-card-name">{open ? `«${m.codename}»` : '«???»'}</span>
                <span className="spies-card-stars" aria-label={`сложность ${String(m.tier)}`}>
                  {strength(m.tier)}
                </span>
                {open || !before ? (
                  <span className="spies-card-reward">
                    Награда: {host.coinsFor(m.tier)} <span aria-hidden="true">🪙</span>
                  </span>
                ) : (
                  <>
                    <span className="spies-lock" aria-hidden="true">
                      🔒
                    </span>
                    <span className="spies-card-reward locked">
                      Сначала поймай: «{before.codename}»
                    </span>
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

/** One mission: the briefing, then three houses in a row, the dossier beside them. */
function Operation({
  host,
  mission,
  number,
  onCompleted,
  onAgain,
  onBoard,
  sound,
}: {
  readonly host: GameHost<ReactNode>
  readonly mission: Mission
  /** Which mission of the visit this is: the tips go on from where the last one stopped. */
  readonly number: number
  /** Pays for the mission; returns the mission it opened, if any. */
  readonly onCompleted: (tier: Tier) => Mission | null
  readonly onAgain: () => void
  readonly onBoard: () => void
  readonly sound: (sound: Sound) => void
}) {
  const [briefed, setBriefed] = useState(false)
  const [caught, setCaught] = useState(0)
  const [task, setTask] = useState<Task>(() => reportFor(host, mission.asks))
  const [outcome, setOutcome] = useState<Outcome<unknown> | null>(null)
  const [opened, setOpened] = useState<Mission | null>(null)

  const reward = host.coinsFor(mission.tier)
  const finished = outcome?.final ?? false
  const right = finished && outcome?.verdict === 'correct'
  const escaped = finished && !right
  const triedAgain = outcome !== null && !finished
  const complete = caught === HOUSES
  const left = HOUSES - caught
  const tip = tipFor((number - 1) * HOUSES + caught)

  const submit = (given: unknown) => {
    const result = host.submit(task, given, 'tap')
    setOutcome(result)
    // A miss sounds through the house's own cues: the spy giggles, then runs.
    if (result.verdict !== 'correct') return
    const now = caught + 1
    setCaught(now)
    if (now === HOUSES) {
      sound('mission')
      setOpened(onCompleted(mission.tier))
    } else {
      sound('caught')
    }
  }

  const nextHouse = () => {
    setTask(reportFor(host, mission.asks))
    setOutcome(null)
  }

  if (!briefed) {
    return (
      <div className="spies-briefing">
        <SpyPortrait mission={mission} />
        <div className="spies-briefing-text">
          <div className="spies-mentor-box">
            <Owl mood="think" />
            <p className="spies-bubble">{mission.briefing}</p>
          </div>
          <p className="spies-tip">
            <b>Совет агента:</b> {tip}
          </p>
          <div className="spies-after">
            <button
              type="button"
              className="spies-next"
              onClick={() => {
                sound('start')
                setBriefed(true)
              }}
            >
              Начать миссию ▶
            </button>
            <button type="button" className="spies-next secondary" onClick={onBoard}>
              В штаб
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mood: OwlMood = complete || right ? 'cheer' : escaped ? 'worry' : 'think'
  const says = complete
    ? `Миссия выполнена! Банда «${mission.codename}» поймана. Награда — ${String(reward)} 🪙`
    : right
      ? `Попался! ${left === 1 ? 'Остался последний дом.' : `Осталось домов: ${String(left)}.`}`
      : escaped
        ? 'Ах, ускользнул! Смотри разбор: донесение по шагам — какие окна подходят.'
        : triedAgain
          ? 'Не то окно. Перечитай донесение и попробуй ещё раз.'
          : `Совет: ${tip}`

  return (
    <div className="spies-play">
      <aside className="spies-dossier">
        {complete && <Stars />}
        <SpyPortrait mission={mission} />
        <ol className="spies-houses" aria-label="Дома">
          {Array.from({ length: HOUSES }, (_, i) => {
            const status: keyof typeof MARK =
              i < caught ? 'done' : i > caught ? 'todo' : escaped ? 'failed' : 'now'
            return (
              <li key={i} className={`spies-house-row ${status}`}>
                <span className="spies-house-mark" aria-hidden="true">
                  {MARK[status]}
                </span>
                Дом {i + 1}
              </li>
            )
          })}
        </ol>
      </aside>

      <div className="spies-street">
        {host.renderPrompt(task)}
        {host.renderAnswer(task, {
          disabled: finished,
          submit,
          cue: (event) => {
            if (isSound(event)) sound(event)
          },
          ...(outcome?.reveal === undefined ? {} : { reveal: outcome.reveal }),
        })}
      </div>

      <div className="spies-side">
        <div className="spies-mentor-box">
          <Owl mood={mood} />
          <p className={`spies-bubble ${complete ? 'win' : escaped ? 'fail' : ''}`} role="status">
            {says}
          </p>
        </div>

        {complete && (
          <div className="spies-verdict win">
            <span className="spies-flying-coin" aria-hidden="true">
              +{reward} 🪙
            </span>
            <strong>Все шпионы пойманы!</strong>
            <span>Награда в копилку: {reward} 🪙</span>
          </div>
        )}

        {opened && (
          <p className="spies-opened" role="status">
            🔓 Новая миссия: <strong>«{opened.codename}»</strong>
          </p>
        )}

        {right && !complete && (
          <button type="button" className="spies-next" onClick={nextHouse}>
            Следующий дом ▶
          </button>
        )}

        {(complete || escaped) && (
          <div className="spies-after">
            <button type="button" className="spies-next" onClick={onAgain}>
              {complete ? 'Ещё миссия' : 'Начать заново'}
            </button>
            <button type="button" className="spies-next secondary" onClick={onBoard}>
              В штаб
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
