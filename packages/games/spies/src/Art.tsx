import type { Mission } from './missions'

/** How the curator looks at the moment. */
export type OwlMood = 'think' | 'cheer' | 'worry'

/**
 * Агент Сова, the curator: an owl in a spy's hat with a headset — sees
 * everything at night. Wings up when a spy is caught, brows down when one is away.
 */
export function Owl({ mood }: { readonly mood: OwlMood }) {
  const brow = mood === 'worry' ? 8 : mood === 'cheer' ? -4 : 0
  return (
    <svg className={`spies-owl mood-${mood}`} viewBox="0 0 120 130" aria-hidden="true">
      {/* Wings: down, or raised in a cheer. */}
      {[-1, 1].map((side) => (
        <path
          key={side}
          className="spies-owl-wing"
          d={
            mood === 'cheer'
              ? `M${String(60 + side * 30)} 70 Q${String(60 + side * 58)} 40 ${String(60 + side * 50)} 18 Q${String(60 + side * 44)} 58 ${String(60 + side * 26)} 92 Z`
              : `M${String(60 + side * 30)} 62 Q${String(60 + side * 50)} 86 ${String(60 + side * 36)} 116 Q${String(60 + side * 26)} 98 ${String(60 + side * 24)} 80 Z`
          }
          fill="#7a5532"
        />
      ))}
      <ellipse cx={60} cy={82} rx={36} ry={42} fill="#94683d" />
      <ellipse cx={60} cy={94} rx={22} ry={26} fill="#e6c999" />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${String(48 + i * 8)} ${String(88 + (i % 2) * 6)} q4 5 8 0`}
          stroke="#b48a5a"
          strokeWidth={2}
          fill="none"
        />
      ))}
      {/* Ear tufts under the hat brim. */}
      <path d="M30 52 L26 34 L42 46 Z" fill="#7a5532" />
      <path d="M90 52 L94 34 L78 46 Z" fill="#7a5532" />
      {/* Eyes: big, ringed in gold. */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={60 + side * 15} cy={64} r={14} fill="#f2c14e" />
          <circle cx={60 + side * 15} cy={64} r={10.5} fill="#fffaf0" />
          <circle
            className="spies-owl-pupil"
            cx={60 + side * 15 + (mood === 'think' ? side * -2 : 0)}
            cy={mood === 'worry' ? 66 : 64}
            r={5}
            fill="#1f1a14"
          />
          <circle cx={60 + side * 15 + 2} cy={62} r={1.6} fill="#fff" />
          <path
            d={`M${String(60 + side * 26)} ${String(48 + brow)} L${String(60 + side * 5)} ${String(50 - brow / 2)}`}
            stroke="#5a3b1f"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      ))}
      <path d="M55 74 L65 74 L60 84 Z" fill="#e59a2f" />
      {mood === 'cheer' && (
        <path
          d="M52 86 Q60 92 68 86"
          stroke="#5a3b1f"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* The spy hat and a headset. */}
      <ellipse cx={60} cy={44} rx={40} ry={7} fill="#2d3347" />
      <path d="M36 44 Q38 18 60 16 Q82 18 84 44 Z" fill="#3b4360" />
      <rect x={38} y={36} width={44} height={6} fill="#c8a14a" />
      <path
        d="M24 66 Q20 44 32 40"
        stroke="#1f2333"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={24} cy={68} r={6} fill="#1f2333" />
      <path
        d="M24 72 Q30 90 46 92"
        stroke="#1f2333"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={47} cy={92} r={3} fill="#e0464a" />
    </svg>
  )
}

/** A gang leader on a mission card: the coat, the hat and the disguise of the mission. */
export function SpyPortrait({
  mission,
  locked = false,
}: {
  readonly mission: Mission
  readonly locked?: boolean
}) {
  const coat = locked ? '#1c2030' : mission.coat
  const skin = locked ? '#1c2030' : '#f0c9a0'
  const dark = locked ? '#151826' : '#1d2030'
  return (
    <svg
      className={`spies-portrait${locked ? ' locked' : ''}`}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <circle cx={60} cy={60} r={56} className="spies-portrait-bg" />
      <path d={`M18 120 Q22 78 60 74 Q98 78 102 120 Z`} fill={coat} />
      <path d="M42 76 L54 96 L60 78 L66 96 L78 76 Z" fill={locked ? coat : '#e9e4d4'} />
      <rect x={52} y={64} width={16} height={14} fill={skin} />
      <ellipse cx={60} cy={52} rx={20} ry={23} fill={skin} />
      {!locked && <Disguise kind={mission.disguise} />}
      <HatShape kind={mission.hat} fill={locked ? '#151826' : dark} band={coat} />
    </svg>
  )
}

function Disguise({ kind }: { readonly kind: Mission['disguise'] }) {
  switch (kind) {
    case 'glasses':
      return (
        <g>
          <rect x={41} y={45} width={16} height={9} rx={4} fill="#1d2030" />
          <rect x={63} y={45} width={16} height={9} rx={4} fill="#1d2030" />
          <rect x={56} y={48} width={8} height={2.5} fill="#1d2030" />
        </g>
      )
    case 'mask':
      return (
        <path d="M38 44 Q60 38 82 44 L80 56 Q70 58 64 52 L56 52 Q50 58 40 56 Z" fill="#1d2030" />
      )
    case 'moustache':
      return (
        <g>
          <circle cx={51} cy={49} r={3} fill="#1d2030" />
          <circle cx={69} cy={49} r={3} fill="#1d2030" />
          <path d="M44 64 Q52 56 60 62 Q68 56 76 64 Q68 62 60 66 Q52 62 44 64 Z" fill="#4a2e1c" />
        </g>
      )
    case 'monocle':
      return (
        <g>
          <circle cx={51} cy={49} r={3} fill="#1d2030" />
          <circle
            cx={69}
            cy={49}
            r={7}
            fill="rgba(200,230,255,0.4)"
            stroke="#c8a14a"
            strokeWidth={2}
          />
          <circle cx={69} cy={49} r={2.5} fill="#1d2030" />
          <path d="M76 52 Q80 66 74 76" stroke="#c8a14a" strokeWidth={1.2} fill="none" />
          <path d="M52 64 Q60 68 68 64" stroke="#7a4a32" strokeWidth={2} fill="none" />
        </g>
      )
  }
}

function HatShape({
  kind,
  fill,
  band,
}: {
  readonly kind: Mission['hat']
  readonly fill: string
  readonly band: string
}) {
  switch (kind) {
    case 'fedora':
      return (
        <g>
          <ellipse cx={60} cy={34} rx={34} ry={7} fill={fill} />
          <path d="M40 34 Q40 12 60 12 Q80 12 80 34 Z" fill={fill} />
          <rect x={40} y={27} width={40} height={5} fill={band} />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M38 36 Q38 14 60 14 Q82 14 82 36 Z" fill={fill} />
          <path d="M38 36 L22 40 Q30 32 40 31 Z" fill={fill} />
          <circle cx={60} cy={15} r={3} fill={band} />
        </g>
      )
    case 'beret':
      return (
        <g>
          <ellipse cx={56} cy={28} rx={28} ry={11} fill={fill} />
          <rect x={58} y={14} width={3} height={6} fill={fill} />
        </g>
      )
    case 'hood':
      return <path d="M34 70 Q30 20 60 14 Q90 20 86 70 Q80 40 60 34 Q40 40 34 70 Z" fill={fill} />
    case 'bowler':
      return (
        <g>
          <ellipse cx={60} cy={32} rx={30} ry={6} fill={fill} />
          <path d="M42 32 Q42 10 60 10 Q78 10 78 32 Z" fill={fill} />
        </g>
      )
    case 'top':
      return (
        <g>
          <ellipse cx={60} cy={32} rx={32} ry={6} fill={fill} />
          <rect x={44} y={2} width={32} height={30} rx={3} fill={fill} />
          <rect x={44} y={24} width={32} height={5} fill="#a3262a" />
        </g>
      )
  }
}

/** Gold stars flying up when a mission is done. */
export function Stars() {
  return (
    <div className="spies-stars" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${String((i * 37) % 100)}%`,
            animationDelay: `${String((i % 7) * 0.12)}s`,
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

/** The menu card: a house at night, a searchlight, a spy in one window. */
export function CoverScene() {
  const windows = [0, 1, 2, 3, 4].flatMap((row) => [0, 1, 2].map((column) => ({ row, column })))
  const lit: Readonly<Record<string, string>> = { '1.0': '🐱', '3.2': '🌵', '0.2': '🧸' }
  return (
    <svg className="spies-cover" viewBox="0 0 320 200" role="img" aria-label="Секретные агенты">
      <defs>
        <linearGradient id="spies-cover-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1430" />
          <stop offset="1" stopColor="#24315c" />
        </linearGradient>
      </defs>
      <rect width={320} height={200} fill="url(#spies-cover-sky)" />
      <circle cx={270} cy={36} r={18} fill="#f4ecc8" />
      {[
        [30, 24],
        [70, 50],
        [210, 18],
        [300, 80],
        [180, 60],
      ].map(([x, y]) => (
        <circle key={`${String(x)}.${String(y)}`} cx={x} cy={y} r={1.6} fill="#fff6c8" />
      ))}
      <polygon className="spies-cover-beam" points="318,200 300,200 150,70 190,58" />
      <g transform="translate(96 30)">
        <rect x={-6} y={-8} width={124} height={10} rx={2} fill="#2a2f45" />
        <rect width={112} height={150} fill="#4a4f6e" />
        {windows.map(({ row, column }) => {
          const key = `${String(row)}.${String(column)}`
          const icon = lit[key]
          const spy = key === '2.1'
          return (
            <g key={key}>
              <rect
                x={10 + column * 34}
                y={8 + row * 29}
                width={24}
                height={20}
                rx={3}
                fill={icon !== undefined || spy ? '#f5d97a' : '#1b2a4a'}
              />
              {icon !== undefined && (
                <text x={22 + column * 34} y={22 + row * 29} fontSize={13} textAnchor="middle">
                  {icon}
                </text>
              )}
              {spy && (
                <g
                  transform={`translate(${String(22 + column * 34)} ${String(20 + row * 29)}) scale(0.42)`}
                >
                  <path d="M-22 18 Q-20 0 0 -2 Q20 0 22 18 Z" fill="#2b2f3d" />
                  <circle cx={0} cy={-12} r={10} fill="#f0c9a0" />
                  <rect x={-9} y={-15} width={18} height={5} rx={2} fill="#1d2030" />
                  <ellipse cx={0} cy={-21} rx={16} ry={3.5} fill="#1d2030" />
                  <rect x={-9} y={-32} width={18} height={12} rx={3} fill="#1d2030" />
                </g>
              )}
            </g>
          )
        })}
      </g>
      <rect y={180} width={320} height={20} fill="#1a1f33" />
    </svg>
  )
}
