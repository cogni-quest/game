import type { Tier } from '@cogni/core'

export type Hat = 'fedora' | 'cap' | 'beret' | 'hood' | 'bowler' | 'top'
export type Disguise = 'glasses' | 'mask' | 'moustache' | 'monocle'

/** One mission per tier: whose gang it is, the briefing, and how its leader looks. */
export interface Mission {
  readonly tier: Tier
  /** The leader's code name. */
  readonly codename: string
  /** What the curator says before it starts: one or two short sentences. */
  readonly briefing: string
  readonly coat: string
  readonly hat: Hat
  readonly disguise: Disguise
}

/**
 * The missions, simplest first. The tier is how hard the reports are; the
 * game asks the core for tasks of that tier and never names a topic, so the
 * briefings never promise what the reports will say.
 */
export const MISSIONS: readonly Mission[] = [
  {
    tier: 1,
    codename: 'Тень',
    briefing: 'Банда Тени заняла три дома на нашей улице. В каждом доме прячется один шпион.',
    coat: '#56607f',
    hat: 'fedora',
    disguise: 'glasses',
  },
  {
    tier: 2,
    codename: 'Хамелеон',
    briefing: 'Хамелеон и его помощники меняют укрытия. Найди всех троих, пока они не ускользнули.',
    coat: '#3f8a63',
    hat: 'cap',
    disguise: 'glasses',
  },
  {
    tier: 3,
    codename: 'Фантом',
    briefing: 'Фантом появляется ночью в окнах высоких домов. Три дома — три агента.',
    coat: '#7d5aa6',
    hat: 'hood',
    disguise: 'mask',
  },
  {
    tier: 4,
    codename: 'Лис',
    briefing: 'Хитрый Лис запутывает следы. Читай донесение до последнего слова.',
    coat: '#c66a2f',
    hat: 'beret',
    disguise: 'moustache',
  },
  {
    tier: 5,
    codename: 'Профессор',
    briefing: 'Профессор шифрует донесения. В них важно каждое слово.',
    coat: '#3c6fa8',
    hat: 'bowler',
    disguise: 'monocle',
  },
  {
    tier: 'boss',
    codename: 'Мистер Икс',
    briefing: 'Мистер Икс — главарь всех шпионов. Его донесения самые хитрые.',
    coat: '#2b2f3d',
    hat: 'top',
    disguise: 'mask',
  },
]

/**
 * A mission is three houses, one report each — one task. Three in a row is
 * enough practice to count, and short enough to finish while the attention
 * lasts.
 */
export const HOUSES = 3

/**
 * What the curator says before a house: ways to read a report and search a
 * house. They teach how to look, and never which window — and no marks for
 * left and right, on the house or in words (decided with the parent). The game
 * cannot see which report comes, so the tips about landmarks and «над / под»
 * say when they apply.
 */
export const TIPS: readonly string[] = [
  'Этажи считай снизу: первый этаж — у самой земли.',
  'Сначала найди нужный этаж, потом ищи окно на нём.',
  '«Слева» и «справа» — так, как ты смотришь на дом с улицы.',
  'Если в донесении есть картинка, сначала найди её в окнах, потом смотри рядом.',
  '«Сразу слева» — значит соседнее окно, вплотную, без пропусков.',
  '«Над» — этажом выше, «под» — этажом ниже, в том же столбике окон.',
  'Выбрал окно — проверь его по каждому слову донесения и только потом лови.',
]

/** The tip before house `number`: they go round, so each house gets the next one. */
export function tipFor(number: number): string {
  return TIPS[number % TIPS.length] ?? ''
}

/**
 * How far the agency is open, kept between visits: how many missions, from
 * the simplest, may be taken. Completing the last open one opens the next —
 * otherwise the child could take only the simplest forever.
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
    ? { opened: Math.min(Math.max(opened, 1), MISSIONS.length) }
    : START
}

/**
 * What the board shows: the kept progress, or every mission open when the
 * address has `?all` — for a parent to try them all. Never saved.
 */
export function shown(progress: Progress, search: string): Progress {
  return new URLSearchParams(search).has('all') ? { opened: MISSIONS.length } : progress
}

export function isOpen(progress: Progress, tier: Tier): boolean {
  return MISSIONS.findIndex((m) => m.tier === tier) < progress.opened
}

/** After a mission is done: the next opens when the hardest open one is. */
export function afterMission(progress: Progress, tier: Tier): Progress {
  const index = MISSIONS.findIndex((m) => m.tier === tier)
  return index === progress.opened - 1 && progress.opened < MISSIONS.length
    ? { opened: progress.opened + 1 }
    : progress
}
