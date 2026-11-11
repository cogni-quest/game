import type { Tier } from '@cogni/core'

export type HeadShape = 'square' | 'round' | 'dome'
export type Antenna = 'ball' | 'double' | 'dish' | 'none'
/** What it moves on: the first module loaded. */
export type Base = 'legs' | 'wheels' | 'tracks'
/** What it works with, in or on its right hand. */
export type Tool = 'broom' | 'box' | 'torch' | 'claw' | 'lamp' | 'shoulders'
export type Hat = 'none' | 'visor' | 'helmet' | 'crest'

/** One robot per tier: what it is called, what it does, and how it looks. */
export interface Robot {
  readonly tier: Tier
  readonly name: string
  readonly job: string
  readonly colour: string
  readonly head: HeadShape
  readonly antenna: Antenna
  readonly base: Base
  readonly tool: Tool
  readonly hat: Hat
  /**
   * The one colour its panel flashes in when a program does not ask colours.
   * Never more than one: once colours are part of what is remembered, a flash
   * in some colour must always mean that colour. None of the task's own
   * colours — red, blue, yellow, green — so it is never taken for one.
   */
  readonly flash: string
}

/**
 * The workshop's robots, simplest first. The tier is how hard its programs
 * are; the game asks the core for tasks of that tier and never names a topic.
 */
export const ROBOTS: readonly Robot[] = [
  {
    tier: 1,
    name: 'Чистюля',
    job: 'подметает мастерскую',
    colour: '#4f9fd8',
    head: 'round',
    antenna: 'ball',
    base: 'wheels',
    tool: 'broom',
    hat: 'none',
    flash: '#6fe8ff',
  },
  {
    tier: 2,
    name: 'Курьер',
    job: 'развозит детали',
    colour: '#e0a33b',
    head: 'square',
    antenna: 'ball',
    base: 'legs',
    tool: 'box',
    hat: 'none',
    flash: '#ffd36b',
  },
  {
    tier: 3,
    name: 'Сварщик',
    job: 'сваривает корпуса',
    colour: '#d8613c',
    head: 'square',
    antenna: 'double',
    base: 'legs',
    tool: 'torch',
    hat: 'visor',
    flash: '#ff9a5b',
  },
  {
    tier: 4,
    name: 'Строитель',
    job: 'поднимает тяжести',
    colour: '#4caf7a',
    head: 'square',
    antenna: 'none',
    base: 'tracks',
    tool: 'claw',
    hat: 'helmet',
    flash: '#6fe8a0',
  },
  {
    tier: 5,
    name: 'Разведчик',
    job: 'ищет путь в шахтах',
    colour: '#8a6de0',
    head: 'round',
    antenna: 'dish',
    base: 'tracks',
    tool: 'lamp',
    hat: 'none',
    flash: '#c08bff',
  },
  {
    tier: 'boss',
    name: 'Титан',
    job: 'главный робот завода',
    colour: '#c9cfdb',
    head: 'dome',
    antenna: 'none',
    base: 'legs',
    tool: 'shoulders',
    hat: 'crest',
    flash: '#e6eef8',
  },
]

/**
 * A robot is assembled from these modules, bottom up; each one is loaded by
 * one program — one task. Three in a row is enough practice to count, and
 * short enough to finish while the attention lasts.
 */
export const MODULES = ['Ходовая', 'Корпус', 'Голова'] as const

/**
 * What the robot's mentor says before a program: ways to hold an order in
 * mind. They teach how to remember, and never tell what to press. The game
 * cannot see which program comes, so the tips for colours and for the
 * backward order say when they apply instead of being kept for certain robots
 * — the curriculum may move those any time.
 */
export const TIPS: readonly string[] = [
  'Следи за огоньками как за дорожкой: откуда и куда она идёт.',
  'Называй про себя, где загорелось: «верх, середина, угол…»',
  'Ищи фигуру: огоньки могут сложиться в линию, уголок или зигзаг.',
  'Если огоньки разного цвета, запоминай парами: «угол — красный, середина — синий».',
  'Не спеши нажимать — время не ограничено. Сначала вспомни весь путь.',
  'Если надо наоборот, сначала вспомни весь путь, а потом иди от последнего огонька.',
  'Если сбился, жми «Назад» и вспомни, какой огонёк был перед этим.',
]

/** The tip before program `number`: they go round, so each program gets the next one. */
export function tipFor(number: number): string {
  return TIPS[number % TIPS.length] ?? ''
}

/**
 * How far the workshop is open, kept between visits: how many robots, from
 * the simplest, may be assembled. Assembling the last open one opens the next
 * — otherwise the child could assemble only the simplest forever
 * (ARCHITECTURE.md, «Уровень внутри шага»).
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
    ? { opened: Math.min(Math.max(opened, 1), ROBOTS.length) }
    : START
}

/**
 * What the board shows: the kept progress, or every robot open when the
 * address has `?all` — for a parent to try them all. It is never saved, so
 * the child's own progress stays as it was.
 */
export function shown(progress: Progress, search: string): Progress {
  return new URLSearchParams(search).has('all') ? { opened: ROBOTS.length } : progress
}

export function isOpen(progress: Progress, tier: Tier): boolean {
  return ROBOTS.findIndex((r) => r.tier === tier) < progress.opened
}

/** After a robot is assembled: the next opens when the strongest open one is. */
export function afterAssembly(progress: Progress, tier: Tier): Progress {
  const index = ROBOTS.findIndex((r) => r.tier === tier)
  return index === progress.opened - 1 && progress.opened < ROBOTS.length
    ? { opened: progress.opened + 1 }
    : progress
}
