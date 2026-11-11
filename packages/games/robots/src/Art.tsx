import { ROBOTS, type Antenna, type Base, type Hat, type Robot, type Tool } from './workshop'
import type { HeadShape } from './workshop'

/**
 * The game's pictures, flat SVG. A robot stands on its own origin — feet at
 * y = 0, centred on x = 0 — and is drawn module by module, bottom up: the
 * modules not yet loaded are a dashed outline, so the child sees the robot
 * grow with every program, and the module just loaded drops into place.
 * Each robot has its own base, tool and hat. Motion is CSS, by class, not
 * SMIL.
 */

const INK = '#0f1626'
const GHOST = 'rgba(200, 225, 255, 0.45)'
const SCREEN = '#16223a'
const GLOW = '#6fe8ff'
const DIM = '#7d8ea8'
const SPARK = '#ffd84a'
const METAL = '#9fb3c8'
const GOLD = '#f2c230'

export type RobotState = 'building' | 'active' | 'broken' | 'locked'

/** Fill and outline of a module: its colour once loaded, a dashed ghost before. */
function part(built: boolean, colour: string) {
  return built
    ? { fill: colour, stroke: INK, strokeWidth: 3 }
    : { fill: 'none', stroke: GHOST, strokeWidth: 2.5, strokeDasharray: '6 5' }
}

/** The module's group: `fresh` makes the one just loaded drop into place. */
function moduleClass(name: string, fresh: boolean): string {
  return `robots-module ${name}${fresh ? ' fresh' : ''}`
}

interface ModuleProps {
  readonly built: boolean
  readonly fresh: boolean
  readonly colour: string
  readonly state: RobotState
}

/* ---- Module 1: what it moves on ---- */

function BaseModule({ kind, built, fresh, colour }: ModuleProps & { readonly kind: Base }) {
  const p = part(built, colour)
  const dark = built ? INK : 'none'
  const edge = built ? INK : GHOST
  const dash = built ? undefined : '6 5'

  if (kind === 'wheels') {
    return (
      <g className={moduleClass('base', fresh)}>
        <rect x={-42} y={-54} width={84} height={30} rx={12} {...p} />
        {built && <rect x={-30} y={-46} width={60} height={6} rx={3} fill="rgba(0, 0, 0, 0.25)" />}
        {[-25, 25].map((x) => (
          <g key={x} className="robots-wheel">
            <circle
              cx={x}
              cy={-14}
              r={14}
              fill={dark}
              stroke={edge}
              strokeWidth={3}
              strokeDasharray={dash}
            />
            {built && (
              <>
                <path
                  d={`M ${String(x - 10)} -14 H ${String(x + 10)} M ${String(x)} -24 V -4`}
                  stroke={METAL}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <circle cx={x} cy={-14} r={4.5} fill={METAL} />
              </>
            )}
          </g>
        ))}
      </g>
    )
  }

  if (kind === 'tracks') {
    return (
      <g className={moduleClass('base', fresh)}>
        <rect x={-34} y={-54} width={68} height={22} rx={6} {...p} />
        <rect
          x={-50}
          y={-34}
          width={100}
          height={32}
          rx={16}
          fill={dark}
          stroke={edge}
          strokeWidth={3}
          strokeDasharray={dash}
        />
        {built && (
          <>
            <rect
              className="robots-tread"
              x={-46}
              y={-30}
              width={92}
              height={24}
              rx={12}
              fill="none"
              stroke={METAL}
              strokeWidth={3}
              strokeDasharray="6 6"
            />
            {[-30, -10, 10, 30].map((x) => (
              <circle key={x} className="robots-wheel" cx={x} cy={-18} r={7} fill={METAL} />
            ))}
          </>
        )}
      </g>
    )
  }

  return (
    <g className={moduleClass('base', fresh)}>
      <rect x={-34} y={-54} width={68} height={14} rx={5} {...p} />
      <rect x={-29} y={-42} width={16} height={32} rx={5} {...p} />
      <rect x={13} y={-42} width={16} height={32} rx={5} {...p} />
      <rect x={-37} y={-12} width={30} height={12} rx={6} {...p} fill={dark} />
      <rect x={7} y={-12} width={30} height={12} rx={6} {...p} fill={dark} />
    </g>
  )
}

/* ---- Module 2: the body, both arms and the tool ---- */

/** The tool in or on the right hand; drawn in the hand's coordinates, the hand at (53, −62). */
function ToolShape({ tool, state }: { readonly tool: Tool; readonly state: RobotState }) {
  switch (tool) {
    case 'broom':
      return (
        <g className="robots-tool broom">
          <line
            x1={58}
            y1={-126}
            x2={58}
            y2={-14}
            stroke="#8a5a2b"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <path
            d="M 44 -16 L 72 -16 L 78 2 L 38 2 Z"
            fill="#e8c26a"
            stroke={INK}
            strokeWidth={2.5}
          />
          <path
            d="M 48 -12 L 46 0 M 58 -12 L 58 0 M 68 -12 L 70 0"
            stroke="#b8923e"
            strokeWidth={2}
          />
        </g>
      )
    case 'box':
      return (
        <g className="robots-tool box">
          <rect
            x={40}
            y={-80}
            width={40}
            height={32}
            rx={3}
            fill="#c9955a"
            stroke={INK}
            strokeWidth={2.5}
          />
          <path d="M 60 -80 V -48 M 40 -66 H 80" stroke="#8a5a2b" strokeWidth={3} />
          <rect x={64} y={-60} width={12} height={8} fill="#f6efe0" />
        </g>
      )
    case 'torch':
      return (
        <g className="robots-tool torch">
          <rect
            x={49}
            y={-66}
            width={9}
            height={18}
            rx={2}
            fill={METAL}
            stroke={INK}
            strokeWidth={2}
          />
          <g className={state === 'locked' ? undefined : 'robots-flame'}>
            <path d="M 46 -48 Q 53 -24 61 -48 Z" fill="#ffb15b" />
            <path d="M 50 -48 Q 53 -34 57 -48 Z" fill="#fff1a8" />
          </g>
        </g>
      )
    case 'claw':
      return (
        <g className="robots-tool claw">
          <rect x={48} y={-66} width={10} height={10} fill={METAL} stroke={INK} strokeWidth={2} />
          <path
            d="M 50 -56 q -12 10 -2 22 M 56 -56 q 12 10 2 22"
            fill="none"
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </g>
      )
    case 'lamp':
      return (
        <g className="robots-tool lamp">
          {state === 'active' && (
            <path
              className="robots-beam"
              d="M -62 -122 L -140 -170 L -140 -96 Z"
              fill="rgba(255, 236, 140, 0.35)"
            />
          )}
          <rect
            x={-72}
            y={-130}
            width={22}
            height={18}
            rx={4}
            fill={METAL}
            stroke={INK}
            strokeWidth={2.5}
          />
          <circle cx={-70} cy={-121} r={6} fill={state === 'active' ? '#fff1a8' : DIM} />
        </g>
      )
    case 'shoulders':
      return (
        <g className="robots-tool shoulders">
          {[-54, 54].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={-114} rx={19} ry={11} fill={GOLD} stroke={INK} strokeWidth={3} />
              <path
                d={`M ${String(x - 10)} -116 H ${String(x + 10)}`}
                stroke="#b8860b"
                strokeWidth={2.5}
              />
            </g>
          ))}
        </g>
      )
  }
}

/** Tools held in the right hand, which wave with it; the rest sit on the shoulders. */
const IN_HAND: ReadonlySet<Tool> = new Set<Tool>(['broom', 'box', 'torch', 'claw'])

function BodyModule({ built, fresh, colour, state, tool }: ModuleProps & { readonly tool: Tool }) {
  const p = part(built, colour)
  const lamps = [-14, 0, 14].flatMap((x) => [-96, -82].map((y) => ({ x, y })))
  return (
    <g className={moduleClass('body', fresh)}>
      <rect x={-60} y={-112} width={14} height={50} rx={7} {...p} />
      <rect x={-46} y={-120} width={92} height={72} rx={14} {...p} />
      {built && (
        <>
          <rect x={-27} y={-106} width={54} height={36} rx={6} fill={SCREEN} />
          {lamps.map(({ x, y }, i) => (
            <circle
              key={i}
              className={state === 'active' ? `robots-chest-lamp n${String(i)}` : undefined}
              cx={x}
              cy={y}
              r={4.5}
              fill={state === 'active' ? GLOW : DIM}
            />
          ))}
          <path
            d="M -36 -58 H 36"
            stroke="rgba(0, 0, 0, 0.25)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </>
      )}
      {/* The right arm and its tool wave together when the robot comes alive. */}
      <g className={`robots-arm ${tool}`}>
        <rect x={46} y={-112} width={14} height={50} rx={7} {...p} />
        {built && IN_HAND.has(tool) && <ToolShape tool={tool} state={state} />}
      </g>
      {built && !IN_HAND.has(tool) && <ToolShape tool={tool} state={state} />}
    </g>
  )
}

/* ---- Module 3: the head ---- */

function AntennaShape({ kind, built }: { readonly kind: Antenna; readonly built: boolean }) {
  if (kind === 'none') return null
  const stroke = built ? INK : GHOST
  const tip = built ? '#ff6b5b' : 'none'
  const dash = built ? undefined : '4 4'
  const stem = (x1: number, x2: number, y2: number) => (
    <line
      x1={x1}
      y1={-178}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={3}
      strokeDasharray={dash}
    />
  )
  if (kind === 'double') {
    return (
      <g className="robots-antenna">
        {stem(-14, -20, -194)}
        {stem(14, 20, -194)}
        <circle
          className="robots-antenna-tip"
          cx={-20}
          cy={-197}
          r={5}
          fill={tip}
          stroke={stroke}
          strokeWidth={2}
        />
        <circle
          className="robots-antenna-tip"
          cx={20}
          cy={-197}
          r={5}
          fill={tip}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    )
  }
  if (kind === 'dish') {
    return (
      <g className="robots-antenna dish">
        {stem(0, 0, -190)}
        <path
          className="robots-dish"
          d="M -17 -198 Q 0 -183 17 -198"
          fill={built ? '#dfe7f2' : 'none'}
          stroke={stroke}
          strokeWidth={3}
          strokeDasharray={dash}
        />
        <circle
          className="robots-antenna-tip"
          cx={0}
          cy={-201}
          r={4}
          fill={tip}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    )
  }
  return (
    <g className="robots-antenna">
      {stem(0, 0, -194)}
      <circle
        className="robots-antenna-tip"
        cx={0}
        cy={-198}
        r={6}
        fill={tip}
        stroke={stroke}
        strokeWidth={2}
      />
    </g>
  )
}

function HatShape({ hat, state }: { readonly hat: Hat; readonly state: RobotState }) {
  if (hat === 'helmet') {
    return (
      <g className="robots-hat helmet">
        <path d="M -38 -176 A 38 30 0 0 1 38 -176 Z" fill={GOLD} stroke={INK} strokeWidth={3} />
        <rect
          x={-46}
          y={-180}
          width={92}
          height={8}
          rx={4}
          fill={GOLD}
          stroke={INK}
          strokeWidth={3}
        />
        <rect x={-5} y={-204} width={10} height={24} rx={4} fill="#e0ae1c" />
      </g>
    )
  }
  if (hat === 'crest') {
    return (
      <g className="robots-hat crest">
        <path
          d="M -32 -178 L -24 -202 L -12 -186 L 0 -210 L 12 -186 L 24 -202 L 32 -178 Z"
          fill={GOLD}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle className="robots-antenna-tip" cx={0} cy={-192} r={4} fill="#ff6b8b" />
      </g>
    )
  }
  if (hat === 'visor') {
    return (
      <g className="robots-hat visor">
        <rect
          x={-30}
          y={-168}
          width={60}
          height={30}
          rx={7}
          fill="#2b2f3a"
          stroke={INK}
          strokeWidth={3}
        />
        <rect
          className={state === 'active' ? 'robots-visor on' : 'robots-visor'}
          x={-22}
          y={-158}
          width={44}
          height={9}
          rx={4}
          fill={state === 'active' ? '#6fe8a0' : state === 'broken' ? '#ff6b5b' : '#3e6b55'}
        />
      </g>
    )
  }
  return null
}

function headOutline(shape: HeadShape): { d?: string; rx: number } {
  if (shape === 'dome') {
    return { d: 'M -36 -128 L -36 -152 A 36 34 0 0 1 36 -152 L 36 -128 Z', rx: 0 }
  }
  return { rx: shape === 'round' ? 24 : 8 }
}

function HeadModule({
  built,
  fresh,
  colour,
  state,
  robot,
}: ModuleProps & { readonly robot: Robot }) {
  const p = part(built, colour)
  const outline = headOutline(robot.head)
  const eye = state === 'active' ? GLOW : DIM
  return (
    <g className={moduleClass('head', fresh)}>
      <AntennaShape kind={robot.antenna} built={built} />
      <rect x={-10} y={-130} width={20} height={12} {...p} />
      {outline.d === undefined ? (
        <rect x={-36} y={-180} width={72} height={52} rx={outline.rx} {...p} />
      ) : (
        <path d={outline.d} {...p} />
      )}
      {built && (
        <>
          <rect x={-26} y={-164} width={52} height={22} rx={10} fill={SCREEN} />
          {state === 'broken' ? (
            <g stroke="#ff6b5b" strokeWidth={3.5} strokeLinecap="round">
              <path d="M -18 -159 l 10 12 M -8 -159 l -10 12" />
              <path d="M 8 -159 l 10 12 M 18 -159 l -10 12" />
            </g>
          ) : (
            <g className={state === 'active' ? 'robots-eyes on' : 'robots-eyes'}>
              <circle cx={-13} cy={-153} r={6} fill={eye} />
              <circle cx={13} cy={-153} r={6} fill={eye} />
            </g>
          )}
          {state === 'active' && (
            <path
              d="M -9 -137 Q 0 -131 9 -137"
              fill="none"
              stroke={INK}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
          {/* Bolts on the cheeks. */}
          <circle cx={-31} cy={-153} r={3} fill={INK} opacity={0.5} />
          <circle cx={31} cy={-153} r={3} fill={INK} opacity={0.5} />
          <HatShape hat={robot.hat} state={state} />
        </>
      )}
    </g>
  )
}

/* ---- The whole robot ---- */

/** Little yellow stars and a puff of smoke: a fuse blew, the program did not load. */
function Sparks() {
  const star = 'M 0 -9 L 2.5 -2.5 L 9 0 L 2.5 2.5 L 0 9 L -2.5 2.5 L -9 0 L -2.5 -2.5 Z'
  const at = [
    [-52, -142],
    [50, -122],
    [-42, -62],
    [44, -172],
    [0, -100],
  ] as const
  return (
    <g className="robots-sparks">
      <circle className="robots-smoke" cx={0} cy={-190} r={14} fill="rgba(160, 170, 190, 0.55)" />
      <circle
        className="robots-smoke n1"
        cx={12}
        cy={-196}
        r={10}
        fill="rgba(160, 170, 190, 0.45)"
      />
      {at.map(([x, y], i) => (
        <path
          key={i}
          className={`robots-spark n${String(i)}`}
          d={star}
          fill={SPARK}
          transform={`translate(${String(x)} ${String(y)})`}
        />
      ))}
    </g>
  )
}

/**
 * A robot, `built` modules of three loaded; `fresh` when the last of them was
 * loaded just now. Active: eyes and chest lit, it hops and waves. Broken:
 * crossed eyes, sparks and smoke. Locked: a dark shape on the board.
 */
export function RobotFigure({
  robot,
  built,
  state,
  fresh = false,
}: {
  readonly robot: Robot
  readonly built: number
  readonly state: RobotState
  readonly fresh?: boolean
}) {
  return (
    <svg
      className={`robots-figure ${state}`}
      viewBox="-80 -228 160 236"
      role="img"
      aria-label={state === 'locked' ? 'Робот закрыт' : `Робот ${robot.name}`}
    >
      <RobotShape robot={robot} built={built} state={state} fresh={fresh} />
    </svg>
  )
}

/** The robot itself, to place inside any picture. */
function RobotShape({
  robot,
  built,
  state,
  fresh,
}: {
  readonly robot: Robot
  readonly built: number
  readonly state: RobotState
  readonly fresh: boolean
}) {
  const colour = state === 'locked' ? '#3a4560' : robot.colour
  const scale = robot.tier === 'boss' ? 1.08 : 1
  const has = (n: number) => state === 'locked' || built >= n
  const isFresh = (n: number) => fresh && built === n
  return (
    <>
      <ellipse cx={0} cy={2} rx={52} ry={6} fill="rgba(0, 0, 0, 0.3)" />
      {/* Motion moves the outer group; the inner one keeps the boss's size, which CSS would override. */}
      <g className="robots-figure-body">
        <g transform={`scale(${String(scale)})`}>
          <BaseModule
            kind={robot.base}
            built={has(1)}
            fresh={isFresh(1)}
            colour={colour}
            state={state}
          />
          <BodyModule
            built={has(2)}
            fresh={isFresh(2)}
            colour={colour}
            state={state}
            tool={robot.tool}
          />
          <HeadModule
            built={has(3)}
            fresh={isFresh(3)}
            colour={colour}
            state={state}
            robot={robot}
          />
        </g>
      </g>
      {state === 'broken' && <Sparks />}
    </>
  )
}

export type MentorMood = 'think' | 'cheer' | 'worry'

/** Бип, the workshop's little flying helper: one big eye, a propeller, a mood. */
export function Mentor({ mood }: { readonly mood: MentorMood }) {
  const eye = mood === 'worry' ? '#ffb15b' : GLOW
  return (
    <svg className={`robots-mentor ${mood}`} viewBox="-40 -48 80 90" role="img" aria-label="Бип">
      <g className="robots-propeller">
        <rect x={-26} y={-44} width={52} height={5} rx={2.5} fill={METAL} />
      </g>
      <rect x={-3} y={-40} width={6} height={10} fill={METAL} />
      <circle cx={0} cy={0} r={30} fill="#dfe7f2" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-2} r={15} fill={SCREEN} />
      <circle className="robots-mentor-eye" cx={0} cy={-2} r={8} fill={eye} />
      {mood === 'cheer' && (
        <path
          d="M -10 16 Q 0 24 10 16"
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      {mood === 'worry' && (
        <path
          d="M -10 20 Q 0 13 10 20"
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      {mood === 'think' && (
        <line x1={-8} y1={18} x2={8} y2={18} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
      <rect x={-38} y={-6} width={8} height={14} rx={3} fill={METAL} />
      <rect x={30} y={-6} width={8} height={14} rx={3} fill={METAL} />
    </svg>
  )
}

/** Bolts, gears and stars falling over the stand when a robot comes alive. */
export function Confetti() {
  const pieces = Array.from({ length: 14 }, (_, i) => i)
  const shapes = ['⚙', '★', '●', '■'] as const
  const colours = ['#ffd84a', '#6fe8ff', '#ff6b8b', '#6fe8a0', '#c08bff'] as const
  return (
    <div className="robots-confetti" aria-hidden="true">
      {pieces.map((i) => (
        <span
          key={i}
          className={`robots-confetti-piece n${String(i % 7)}`}
          style={{
            left: `${String(4 + ((i * 37) % 92))}%`,
            color: colours[i % colours.length],
            animationDelay: `${String((i % 5) * 0.12)}s`,
          }}
        >
          {shapes[i % shapes.length]}
        </span>
      ))}
    </div>
  )
}

/** The menu card: two robots at work beside a panel of lights, one of them lit. */
export function CoverScene() {
  const [sweeper, , welder] = ROBOTS
  if (!sweeper || !welder) return null
  const lamps = [0, 1, 2].flatMap((row) => [0, 1, 2].map((column) => ({ row, column })))
  const lit = ['#6fe8ff', '#ffd84a', '#ff6b8b']
  return (
    <svg className="robots-cover" viewBox="0 0 320 200" role="img" aria-label="Робо-мастерская">
      <rect width={320} height={200} fill="#18202f" />
      <rect y={168} width={320} height={32} fill="#232e44" />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1={i * 40}
          y1={168}
          x2={i * 40 - 20}
          y2={200}
          stroke="#2e3b57"
          strokeWidth={2}
        />
      ))}
      <g transform="translate(52 170) scale(0.5)">
        <RobotShape robot={sweeper} built={3} state="active" fresh={false} />
      </g>
      <g transform="translate(128 168) scale(0.66)">
        <RobotShape robot={welder} built={3} state="active" fresh={false} />
      </g>
      <g transform="translate(196 50)">
        <rect width={110} height={110} rx={14} fill="#1d2740" stroke="#33415f" strokeWidth={3} />
        {lamps.map(({ row, column }, i) => {
          const which = [5, 1, 6].indexOf(i)
          return (
            <circle
              key={`${String(row)}.${String(column)}`}
              className={which >= 0 ? `robots-cover-lit n${String(which)}` : undefined}
              cx={22 + column * 33}
              cy={22 + row * 33}
              r={12}
              fill={which >= 0 ? (lit[which] ?? GLOW) : '#34405f'}
            />
          )
        })}
      </g>
    </svg>
  )
}
