import type { Tier } from '@cogni/core'

/** One thief per tier: who he is on the poster, and the colour of his hat. */
export interface Thief {
  readonly tier: Tier
  readonly name: string
  readonly hat: string
}

/**
 * The wanted board, weakest first. The tier is how hard the trail is; the
 * game asks the core for a task of that tier and never names a topic.
 */
export const THIEVES: readonly Thief[] = [
  { tier: 1, name: 'Мелкий воришка', hat: '#6b7280' },
  { tier: 2, name: 'Карманник', hat: '#2f855a' },
  { tier: 3, name: 'Ловкий вор', hat: '#2b6cb0' },
  { tier: 4, name: 'Вор-домушник', hat: '#6b46c1' },
  { tier: 5, name: 'Хитрый лис', hat: '#c05621' },
  { tier: 'boss', name: 'Главарь банды', hat: '#1f1d2b' },
]

/**
 * How far the board is open, kept between visits: how many thieves, from the
 * weakest, may be chased. The first is always open; catching the last open
 * one opens the next. Without this the board would let the child catch only
 * the easiest forever (ARCHITECTURE.md, «Уровень внутри шага»).
 */
export interface Progress {
  readonly opened: number
}

export const START: Progress = { opened: 1 }

/** Progress from whatever the host kept, or the start when it is missing or not ours. */
export function readProgress(stored: unknown): Progress {
  if (typeof stored !== 'object' || stored === null || !('opened' in stored)) return START
  const { opened } = stored
  return typeof opened === 'number' && Number.isInteger(opened)
    ? { opened: Math.min(Math.max(opened, 1), THIEVES.length) }
    : START
}

export function isOpen(progress: Progress, tier: Tier): boolean {
  return THIEVES.findIndex((t) => t.tier === tier) < progress.opened
}

/** After a catch: the next thief opens when the strongest open one is caught. */
export function afterCatch(progress: Progress, tier: Tier): Progress {
  const index = THIEVES.findIndex((t) => t.tier === tier)
  return index === progress.opened - 1 && progress.opened < THIEVES.length
    ? { opened: progress.opened + 1 }
    : progress
}
