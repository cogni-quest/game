import type { ReactNode } from 'react'

/**
 * The game's pictures, drawn here as SVG in a flat cartoon style: a
 * policeman and a masked robber with a money sack. Each character stands on
 * its own origin — feet at y = 0, centred on x = 0 — so a scene only places
 * it. Limbs swing with SMIL rotations about the hip or shoulder.
 */

const SKIN = '#f2c7a0'
const SKIN_SHADE = '#e0a97f'
const INK = '#1f1d2b'
const NAVY = '#233f80'
const BLUE = '#3460b0'
const PANTS = '#2c4688'
const GOLD = '#f2b632'
const SACK = '#c9955a'
const SACK_SHADE = '#a8763f'
const THIEF_PANTS = '#55597a'

type Swing = 'none' | 'run' | 'walk'

/** A limb swinging about (cx, cy), between +deg and −deg, or still. */
function Sway({
  swing,
  degrees,
  cx,
  cy,
  phase = 0,
  children,
}: {
  readonly swing: Swing
  readonly degrees: number
  readonly cx: number
  readonly cy: number
  readonly phase?: 0 | 1
  readonly children: ReactNode
}) {
  const a = phase === 0 ? degrees : -degrees
  const at = (d: number) => `${String(d)} ${String(cx)} ${String(cy)}`
  return (
    <g transform={swing === 'none' ? `rotate(${at(a / 3)})` : undefined}>
      {swing !== 'none' && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={`${at(a)}; ${at(-a)}; ${at(a)}`}
          dur={swing === 'run' ? '0.38s' : '0.8s'}
          repeatCount="indefinite"
        />
      )}
      {children}
    </g>
  )
}

/**
 * One leg from the hip at (x, −44) down to its shoe. The light edge keeps a
 * dark trouser leg visible against the night.
 */
function Leg({
  x,
  colour,
  shoe,
}: {
  readonly x: number
  readonly colour: string
  readonly shoe: string
}) {
  return (
    <>
      <rect
        x={x - 6}
        y={-46}
        width={12}
        height={42}
        rx={6}
        fill={colour}
        stroke="rgba(246, 239, 224, 0.55)"
        strokeWidth={1.5}
      />
      <ellipse cx={x + 4} cy={-4} rx={9.5} ry={5.5} fill={shoe} stroke="rgba(246, 239, 224, 0.4)" />
    </>
  )
}

/** Two legs: apart when standing, scissoring from one hip when running. */
function Legs({ run, colour }: { readonly run: boolean; readonly colour: string }) {
  const apart = run ? 0 : 7
  return (
    <>
      <Sway swing={run ? 'run' : 'none'} degrees={run ? 32 : 0} cx={-apart} cy={-44} phase={1}>
        <Leg x={-apart} colour={colour} shoe={INK} />
      </Sway>
      <Sway swing={run ? 'run' : 'none'} degrees={run ? 32 : 0} cx={apart} cy={-44}>
        <Leg x={apart} colour={colour} shoe={INK} />
      </Sway>
    </>
  )
}

/* ------------------------------------------------------------------ robber */

export type ThiefPose = 'run' | 'caught' | 'peek'

/**
 * The robber: beanie, black eye mask, striped shirt, and a sack of coins. The
 * beanie's colour tells one thief of the wanted board from another.
 */
export function Thief({ pose, hat = INK }: { readonly pose: ThiefPose; readonly hat?: string }) {
  const run = pose === 'run'
  const caught = pose === 'caught'
  return (
    <g>
      {/* Legs */}
      <Legs run={run} colour={THIEF_PANTS} />

      <g transform={run ? 'rotate(10 0 -44)' : caught ? 'rotate(-6 0 -44)' : undefined}>
        {/* The sack over the shoulder — on the ground once he is caught */}
        {!caught && (
          <g>
            <ellipse cx={-20} cy={-88} rx={19} ry={17} fill={SACK} />
            <path
              d="M -27 -102 Q -20 -110 -12 -102"
              fill="none"
              stroke={SACK_SHADE}
              strokeWidth={4}
            />
            <text x={-20} y={-81} textAnchor="middle" fontSize={18} fontWeight={800} fill="#6b4310">
              $
            </text>
          </g>
        )}

        {/* Shirt with stripes */}
        <rect x={-15} y={-82} width={30} height={42} rx={9} fill="#fbfbf7" />
        {[-74, -64, -54].map((y) => (
          <rect key={y} x={-15} y={y} width={30} height={5} fill={INK} />
        ))}

        {/* Arms: one holds the sack, the other swings — or both held in cuffs */}
        {caught ? (
          <>
            <path
              d="M -12 -76 Q -6 -60 2 -58"
              fill="none"
              stroke={SKIN}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <path
              d="M 12 -76 Q 8 -60 4 -58"
              fill="none"
              stroke={SKIN}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <circle cx={-1} cy={-57} r={4.5} fill="none" stroke="#9aa0ad" strokeWidth={3} />
            <circle cx={7} cy={-57} r={4.5} fill="none" stroke="#9aa0ad" strokeWidth={3} />
          </>
        ) : (
          <>
            <path
              d="M -12 -76 Q -22 -88 -24 -98"
              fill="none"
              stroke={SKIN}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <Sway swing={run ? 'run' : 'none'} degrees={run ? 40 : 10} cx={12} cy={-76}>
              <path
                d="M 12 -76 L 22 -56"
                fill="none"
                stroke={SKIN}
                strokeWidth={8}
                strokeLinecap="round"
              />
            </Sway>
          </>
        )}

        {/* Head */}
        <circle cx={0} cy={-98} r={16} fill={SKIN} />
        <circle cx={-15} cy={-96} r={3.5} fill={SKIN_SHADE} />
        <path d="M -16 -101 Q -16 -124 0 -124 Q 16 -124 16 -101 Z" fill={hat} />
        <rect x={-17} y={-105} width={34} height={6} rx={3} fill="#3d3a52" />
        <circle cx={0} cy={-126} r={4} fill="#3d3a52" />
        <rect x={-17} y={-99} width={34} height={9} rx={4.5} fill={INK} />
        {caught ? (
          <>
            {/* Dizzy eyes */}
            <path
              d="M -9 -97 l 5 5 m 0 -5 l -5 5 M 4 -97 l 5 5 m 0 -5 l -5 5"
              stroke="#fff"
              strokeWidth={2}
            />
            <path
              d="M -5 -84 Q 0 -87 5 -84"
              fill="none"
              stroke={INK}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx={-6} cy={-94.5} r={3.2} fill="#fff" />
            <circle cx={6} cy={-94.5} r={3.2} fill="#fff" />
            <g>
              {pose === 'peek' && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="-1.2 0; 1.2 0; -1.2 0"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              )}
              <circle cx={-5} cy={-94.5} r={1.6} fill={INK} />
              <circle cx={7} cy={-94.5} r={1.6} fill={INK} />
            </g>
            <path
              d="M -6 -85 Q 0 -80 6 -85"
              fill="none"
              stroke={INK}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </>
        )}
      </g>
    </g>
  )
}

/* -------------------------------------------------------------- policeman */

export type CopPose = 'stand' | 'run' | 'hold' | 'tired'

/** The policeman: blue uniform and cap, gold badge, a big moustache. */
export function Cop({ pose }: { readonly pose: CopPose }) {
  const run = pose === 'run'
  return (
    <g>
      <Legs run={run} colour={PANTS} />

      <g transform={run ? 'rotate(8 0 -44)' : pose === 'tired' ? 'rotate(14 0 -44)' : undefined}>
        {/* Back arm */}
        <Sway swing={run ? 'run' : 'none'} degrees={run ? 36 : 6} cx={-12} cy={-78} phase={1}>
          <path
            d="M -12 -78 L -18 -54"
            fill="none"
            stroke={BLUE}
            strokeWidth={9}
            strokeLinecap="round"
          />
          <circle cx={-18} cy={-52} r={4.5} fill={SKIN} />
        </Sway>

        {/* Uniform */}
        <rect x={-17} y={-86} width={34} height={46} rx={10} fill={BLUE} />
        <rect x={-17} y={-48} width={34} height={6} fill={INK} />
        <rect x={-3} y={-48} width={6} height={6} fill={GOLD} />
        <path d="M -9 -76 l 2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5 Z" fill={GOLD} />
        <path d="M -6 -86 L 0 -78 L 6 -86" fill="none" stroke="#eaf0ff" strokeWidth={3} />

        {/* Front arm, by pose */}
        {pose === 'hold' ? (
          <>
            <path
              d="M 12 -78 Q 30 -80 44 -84"
              fill="none"
              stroke={BLUE}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <circle cx={46} cy={-84} r={5} fill={SKIN} />
          </>
        ) : pose === 'stand' ? (
          <>
            {/* Holding up a magnifier */}
            <path
              d="M 12 -78 Q 24 -86 26 -100"
              fill="none"
              stroke={BLUE}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <circle cx={26} cy={-102} r={4.5} fill={SKIN} />
            <line
              x1={27}
              y1={-104}
              x2={33}
              y2={-114}
              stroke="#6b4a2b"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <circle
              cx={38}
              cy={-122}
              r={10}
              fill="rgba(200, 230, 255, 0.55)"
              stroke="#6b4a2b"
              strokeWidth={3.5}
            />
          </>
        ) : pose === 'tired' ? (
          <>
            <path
              d="M 12 -78 L 16 -54"
              fill="none"
              stroke={BLUE}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <circle cx={16} cy={-52} r={4.5} fill={SKIN} />
          </>
        ) : (
          <Sway swing="run" degrees={36} cx={12} cy={-78}>
            {/* Shaking a fist */}
            <path
              d="M 12 -78 Q 26 -84 30 -98"
              fill="none"
              stroke={BLUE}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <circle cx={30} cy={-100} r={5} fill={SKIN} />
          </Sway>
        )}

        {/* Head */}
        <circle cx={0} cy={-102} r={17} fill={SKIN} />
        <circle cx={16} cy={-100} r={3.5} fill={SKIN_SHADE} />
        <path d="M -19 -110 L -15 -129 Q 0 -134 15 -129 L 19 -110 Z" fill={NAVY} />
        <rect x={-20} y={-112} width={40} height={6} rx={3} fill={INK} />
        <path d="M -18 -108 Q 0 -102 22 -108 L 24 -105 Q 0 -98 -18 -105 Z" fill={INK} />
        <circle cx={0} cy={-120} r={4} fill={GOLD} />
        {pose === 'tired' ? (
          <path
            d="M -9 -99 l 5 0 M 4 -99 l 5 0"
            stroke={INK}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle cx={-6} cy={-99} r={2.2} fill={INK} />
            <circle cx={6} cy={-99} r={2.2} fill={INK} />
          </>
        )}
        <circle cx={0} cy={-94} r={3} fill={SKIN_SHADE} />
        <path
          d="M -12 -89 Q -6 -94 0 -90 Q 6 -94 12 -89 Q 6 -86 0 -88 Q -6 -86 -12 -89 Z"
          fill="#6b4320"
        />
        {pose === 'hold' && (
          <path
            d="M -5 -84 Q 0 -80 5 -84"
            fill="none"
            stroke={INK}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        )}
        {pose === 'tired' && (
          <>
            <path d="M -22 -116 q -3 6 0 8 q 3 -2 0 -8 Z" fill="#8fd3ff" />
            <ellipse cx={2} cy={-82} rx={3} ry={2.5} fill={INK} />
          </>
        )}
      </g>
    </g>
  )
}

/* ----------------------------------------------------------------- scenes */

function Ground() {
  return (
    <>
      <ellipse cx={120} cy={152} rx={112} ry={9} fill="rgba(0, 0, 0, 0.18)" />
      <rect x={0} y={150} width={240} height={2} fill="rgba(255, 255, 255, 0.15)" />
    </>
  )
}

function Scene({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <svg className="detective-art" viewBox="0 0 240 165" role="img" aria-label={label}>
      <Ground />
      {children}
    </svg>
  )
}

/** Caught: the policeman holds the robber in cuffs; the sack lies at his feet, coins out. */
export function CaughtScene({ hat }: { readonly hat: string }) {
  return (
    <Scene label="Полицейский поймал вора">
      <g transform="translate(78 150)">
        <Cop pose="hold" />
      </g>
      <g transform="translate(150 150)">
        <Thief pose="caught" hat={hat} />
      </g>
      {/* Dizzy stars circling above his head */}
      {[0, 1, 2].map((i) => (
        <text
          key={i}
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill={GOLD}
        >
          <animateMotion
            dur="1.5s"
            begin={`${String(-i * 0.5)}s`}
            repeatCount="indefinite"
            path="M 128 24 a 22 7 0 1 0 44 0 a 22 7 0 1 0 -44 0"
          />
          ★
        </text>
      ))}
      {/* The sack on the ground, coins spilling */}
      <g transform="translate(205 150)">
        <ellipse cx={0} cy={-14} rx={17} ry={14} fill={SACK} />
        <text x={0} y={-8} textAnchor="middle" fontSize={15} fontWeight={800} fill="#6b4310">
          $
        </text>
        {[
          [-24, -3],
          [-14, -1],
          [18, -2],
        ].map(([x = 0, y = 0]) => (
          <ellipse key={x} cx={x} cy={y} rx={5} ry={2.6} fill={GOLD} stroke="#a87f12" />
        ))}
      </g>
    </Scene>
  )
}

/**
 * Escaped: the robber runs off the picture with the sack; the policeman falls
 * behind, puffing. The run is a CSS animation, not SMIL: an inline SVG's SMIL
 * clock starts with the page, so a one-off would be over before the scene shows.
 */
export function EscapeScene({ hat }: { readonly hat: string }) {
  return (
    <Scene label="Вор убегает от полицейского">
      <g transform="translate(70 150)">
        <g className="detective-chase">
          <Cop pose="run" />
        </g>
      </g>
      <g transform="translate(150 150)">
        <g className="detective-run-off">
          {/* Dust and speed lines behind him */}
          {[
            [-30, -8, 7],
            [-42, -4, 5],
            [-52, -10, 4],
          ].map(([x = 0, y = 0, r = 0]) => (
            <circle key={x} cx={x} cy={y} r={r} fill="rgba(246, 239, 224, 0.55)" />
          ))}
          {[-70, -56, -42].map((y) => (
            <line
              key={y}
              x1={-46}
              y1={y}
              x2={-28}
              y2={y}
              stroke="rgba(246, 239, 224, 0.6)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
          <Thief pose="run" hat={hat} />
        </g>
      </g>
    </Scene>
  )
}

/** The game's card in the menu: the policeman on the lookout, the robber behind the wall. */
export function CoverScene() {
  return (
    <div className="detective-cover">
      <HidingScene lookout />
    </div>
  )
}

/** Before the answer: the robber peeks out from behind a brick wall. */
export function HidingScene({
  hat = INK,
  lookout = false,
}: {
  readonly hat?: string
  readonly lookout?: boolean
}) {
  // A wall taller than he is: only one masked eye and the sack show at its edge.
  const bricks: { x: number; y: number }[] = []
  for (let row = 0; row < 9; row++) {
    for (let i = 0; i < 5; i++)
      bricks.push({ x: 122 + i * 26 - (row % 2) * 13, y: 40 + row * 12.2 })
  }
  return (
    <Scene label="Вор прячется за стеной">
      <g transform="translate(126 150)">
        <Thief pose="peek" hat={hat} />
      </g>
      <rect x={120} y={38} width={96} height={112} rx={3} fill="#a2563c" />
      {bricks.map(({ x, y }) => (
        <rect
          key={`${String(x)}.${String(y)}`}
          x={Math.max(x, 120)}
          y={y}
          width={Math.min(24, 216 - Math.max(x, 120))}
          height={10.5}
          rx={1.5}
          fill="#c2694a"
        />
      ))}
      {lookout ? (
        <g transform="translate(46 150) scale(0.95)">
          <Cop pose="stand" />
        </g>
      ) : (
        <text
          x={56}
          y={112}
          textAnchor="middle"
          fontSize={44}
          fontWeight={800}
          fill="rgba(246, 239, 224, 0.5)"
        >
          ?
        </text>
      )}
    </Scene>
  )
}

/** The robber's face for the wanted poster, framed to his head and shoulders; the boss wears a crown. */
export function ThiefPortrait({ hat, boss }: { readonly hat: string; readonly boss: boolean }) {
  return (
    <svg
      className="detective-mugshot"
      viewBox="-30 -138 60 64"
      role="img"
      aria-label="Портрет вора"
    >
      <rect x={-30} y={-138} width={60} height={64} fill="#d8c9a4" />
      {[-130, -118, -106, -94, -82].map((y) => (
        <line key={y} x1={-30} y1={y} x2={30} y2={y} stroke="#c7b68c" strokeWidth={1} />
      ))}
      <Thief pose="peek" hat={hat} />
      {boss && (
        <path
          d="M -12 -126 L -12 -136 L -6 -131 L 0 -138 L 6 -131 L 12 -136 L 12 -126 Z"
          fill={GOLD}
          stroke="#a87f12"
          strokeWidth={1.5}
        />
      )}
    </svg>
  )
}

/** The hero beside the board: the policeman with his magnifier. */
export function CopPortrait({ mood }: { readonly mood: 'look' | 'cheer' | 'sigh' }) {
  return (
    <svg
      className={`detective-portrait ${mood}`}
      viewBox="-50 -145 100 150"
      role="img"
      aria-label="Полицейский"
    >
      <ellipse cx={0} cy={0} rx={34} ry={5} fill="rgba(0, 0, 0, 0.25)" />
      <Cop pose={mood === 'sigh' ? 'tired' : 'stand'} />
    </svg>
  )
}
