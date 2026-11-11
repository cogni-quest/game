import type { GameHost, Outcome, Task, Tier } from '@cogni/core'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

import { Confetti, Mentor, RobotFigure, type MentorMood, type RobotState } from './Art'
import {
  afterAssembly,
  isOpen,
  MODULES,
  readProgress,
  ROBOTS,
  shown,
  tipFor,
  type Progress,
  type Robot,
} from './workshop'
import { isSound, play, type Sound } from './sounds'
import './robots.css'

/** Its tasks: working memory, whichever topic of it the core chooses. */
export const SUBJECT = 'memory'

export const GAME_ID = 'robots'

/** Where the host keeps whether the workshop's sounds are off. */
const SOUND_ID = 'robots-sound'

/** On by default; off only when the kept setting says so. */
function readMuted(stored: unknown): boolean {
  return typeof stored === 'object' && stored !== null && 'muted' in stored && stored.muted === true
}

/** How hard the robot's programs are, as its card says it. */
function strength(tier: Tier): string {
  return tier === 'boss' ? '👑' : '★'.repeat(tier)
}

/** A module row's mark: loaded, failed, loading now, still to come. */
const MARK = { done: '✔', failed: '✖', now: '▶', todo: '○' } as const

function programFor(host: GameHost<ReactNode>, tier: Tier): Task {
  const [task] = host.requestTasks({ count: 1, tier, subject: SUBJECT })
  if (!task) throw new Error('The host gave no task for the program')
  return task
}

/**
 * The workshop. It opens on the robots' board: the child picks which robot to
 * assemble among those opened so far. A robot is three modules, each loaded by
 * one program — repeat the lights; a wrong program blows a fuse and the
 * assembly starts over. Assembling the strongest open robot opens the next.
 */
export function Robots({ host }: { readonly host: GameHost<ReactNode> }) {
  const [progress, setProgress] = useState<Progress>(() =>
    readProgress(host.loadGameState(GAME_ID)),
  )
  const [robot, setRobot] = useState<Robot | null>(null)
  const [number, setNumber] = useState(0)
  const [coins, setCoins] = useState(() => host.coins())
  const [muted, setMuted] = useState(() => readMuted(host.loadGameState(SOUND_ID)))

  useEffect(() => host.onCoins(setCoins), [host])

  const sound = (which: Sound) => {
    play(which, muted)
  }

  const start = (chosen: Robot) => {
    sound('pick')
    setRobot(chosen)
    setNumber(number + 1)
  }

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    host.saveGameState(SOUND_ID, { muted: next })
    if (!next) play('choose', false)
  }

  const assembled = (tier: Tier): Robot | null => {
    host.encounterWon(tier)
    const next = afterAssembly(progress, tier)
    if (next === progress) return null
    setProgress(next)
    host.saveGameState(GAME_ID, next)
    return ROBOTS[next.opened - 1] ?? null
  }

  return (
    <section className="robots">
      <header className="robots-header">
        <span className="robots-title">{robot ? `Сборка: ${robot.name}` : 'Робо-мастерская'}</span>
        <button
          type="button"
          className={`robots-sound ${muted ? 'off' : 'on'}`}
          aria-pressed={!muted}
          aria-label={muted ? 'Включить звуки' : 'Выключить звуки'}
          onClick={toggleSound}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <span className="robots-coins" aria-label={`Монеты: ${String(coins)}`}>
          <span aria-hidden="true">🪙</span>
          {/* A new key on every change replays the bump. */}
          <span key={coins} className="robots-coins-count">
            {coins}
          </span>
        </span>
      </header>

      {robot ? (
        <Assembly
          key={number}
          host={host}
          robot={robot}
          number={number}
          onAssembled={assembled}
          onAgain={() => {
            start(robot)
          }}
          onBoard={() => {
            setRobot(null)
          }}
          sound={sound}
        />
      ) : (
        <Board host={host} progress={shown(progress, location.search)} onPick={start} />
      )}
    </section>
  )
}

/** Every robot on a card; the ones not yet opened are a dark shape under a padlock. */
function Board({
  host,
  progress,
  onPick,
}: {
  readonly host: GameHost<ReactNode>
  readonly progress: Progress
  readonly onPick: (robot: Robot) => void
}) {
  return (
    <div className="robots-board">
      <div className="robots-board-hero">
        <Mentor mood="think" />
        <p className="robots-bubble">
          Я Бип, помощник мастера. Кого собираем? Робот запускается, когда ты повторишь огоньки трёх
          его программ.
        </p>
      </div>
      <ul className="robots-cards">
        {ROBOTS.map((r, i) => {
          const open = isOpen(progress, r.tier)
          const before = ROBOTS[i - 1]
          return (
            <li key={String(r.tier)}>
              <button
                type="button"
                className={`robots-card ${open ? '' : 'locked'}`}
                disabled={!open}
                onClick={() => {
                  onPick(r)
                }}
              >
                <RobotFigure robot={r} built={3} state={open ? 'building' : 'locked'} />
                <span className="robots-card-name">{r.name}</span>
                <span className="robots-card-job">{r.job}</span>
                <span className="robots-card-stars" aria-label={`сложность ${String(r.tier)}`}>
                  {strength(r.tier)}
                </span>
                {open || !before ? (
                  <span className="robots-card-reward">
                    Награда: {host.coinsFor(r.tier)} <span aria-hidden="true">🪙</span>
                  </span>
                ) : (
                  <>
                    <span className="robots-lock" aria-hidden="true">
                      🔒
                    </span>
                    <span className="robots-card-reward locked">Сначала собери: {before.name}</span>
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

/** One assembly: three programs in a row, the robot growing beside the panel. */
function Assembly({
  host,
  robot,
  number,
  onAssembled,
  onAgain,
  onBoard,
  sound,
}: {
  readonly host: GameHost<ReactNode>
  readonly robot: Robot
  /** Which assembly of the visit this is: the tips go on from where the last one stopped. */
  readonly number: number
  /** Pays for the robot; returns the robot it opened, if any. */
  readonly onAssembled: (tier: Tier) => Robot | null
  readonly onAgain: () => void
  readonly onBoard: () => void
  readonly sound: (sound: Sound) => void
}) {
  const [built, setBuilt] = useState(0)
  const [task, setTask] = useState<Task>(() => programFor(host, robot.tier))
  const [outcome, setOutcome] = useState<Outcome<unknown> | null>(null)
  const [opened, setOpened] = useState<Robot | null>(null)

  const reward = host.coinsFor(robot.tier)
  const finished = outcome?.final ?? false
  const loaded = finished && outcome?.verdict === 'correct'
  const broken = finished && !loaded
  const complete = built === MODULES.length
  const left = MODULES.length - built

  const submit = (given: unknown) => {
    const result = host.submit(task, given, 'tap')
    setOutcome(result)
    if (result.verdict !== 'correct') {
      if (result.final) sound('broken')
      return
    }
    const now = built + 1
    setBuilt(now)
    if (now === MODULES.length) {
      sound('alive')
      setOpened(onAssembled(robot.tier))
    } else {
      sound('loaded')
    }
  }

  const nextModule = () => {
    setTask(programFor(host, robot.tier))
    setOutcome(null)
  }

  const state: RobotState = complete ? 'active' : broken ? 'broken' : 'building'
  const mood: MentorMood = complete || loaded ? 'cheer' : broken ? 'worry' : 'think'
  const says = complete
    ? `Ура, ${robot.name} работает! Награда — ${String(reward)} 🪙`
    : loaded
      ? `Модуль «${MODULES[built - 1] ?? ''}» загружен! ${left === 1 ? 'Остался последний.' : `Осталось ${String(left)}.`}`
      : broken
        ? 'Сбой! Посмотри на панели правильный порядок — по номерам. Запомни, где сбился.'
        : `Совет: ${tipFor((number - 1) * MODULES.length + built)}`

  return (
    <div className="robots-play">
      <aside className="robots-stand">
        {complete && <Confetti />}
        <RobotFigure robot={robot} built={built} state={state} fresh={loaded} />
        <ol className="robots-modules" aria-label="Модули">
          {MODULES.map((name, i) => {
            const status: keyof typeof MARK =
              i < built ? 'done' : i > built ? 'todo' : broken ? 'failed' : 'now'
            return (
              <li key={name} className={`robots-module-row ${status}`}>
                <span className="robots-module-mark" aria-hidden="true">
                  {MARK[status]}
                </span>
                {name}
              </li>
            )
          })}
        </ol>
      </aside>

      {/* The panel's plain flashes in the robot's own colour; coloured programs keep theirs. */}
      <div className="robots-console" style={{ '--lights-flash': robot.flash } as CSSProperties}>
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

      <div className="robots-side">
        <div className="robots-mentor-box">
          <Mentor mood={mood} />
          <p className={`robots-bubble ${complete ? 'win' : broken ? 'fail' : ''}`} role="status">
            {says}
          </p>
        </div>

        {complete && (
          <div className="robots-verdict win">
            <span className="robots-flying-coin" aria-hidden="true">
              +{reward} 🪙
            </span>
            <strong>Робот запущен!</strong>
            <span>Награда в копилку: {reward} 🪙</span>
          </div>
        )}

        {opened && (
          <p className="robots-opened" role="status">
            🔓 В мастерской новый робот: <strong>{opened.name}</strong>
          </p>
        )}

        {loaded && !complete && (
          <button type="button" className="robots-next" onClick={nextModule}>
            Следующий модуль ▶
          </button>
        )}

        {(complete || broken) && (
          <div className="robots-after">
            <button type="button" className="robots-next" onClick={onAgain}>
              {complete ? 'Собрать ещё' : 'Собрать заново'}
            </button>
            <button type="button" className="robots-next secondary" onClick={onBoard}>
              В мастерскую
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
