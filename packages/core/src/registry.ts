import { pick, type Random } from './random'
import type { ItemWeights, Task, TaskPlugin } from './task'

/** How strong the asker is: a monster's level, a cloud's height. The boss is the top. */
export type Tier = 1 | 2 | 3 | 4 | 5 | 'boss'

/** A level of a format: 1–5, each its own band of sections, or the boss's. */
export type Level = Tier

/** Ordinary formats have this many levels, each a band of their sections. */
export const LEVELS = 5

/** One section of the textbook's topic — one «приём»: a setting of the plugin's knobs. */
export interface Section {
  readonly knobs: unknown
}

/**
 * One way of asking a step: a plugin and the topic's sections in the
 * textbook's order, as many as there are. A format with `stars` holds
 * non-standard tasks (★) or olympiad ones (★★) — only the boss asks those.
 */
export interface Format {
  readonly plugin: string
  readonly stars?: 1 | 2
  readonly sections: readonly Section[]
}

/**
 * The smallest piece of a topic that is learnt at a time. Several formats ask
 * the same skill in different ways; mastery counts them together.
 */
export interface Step {
  readonly id: string
  readonly formats: readonly Format[]
}

/** What a boss's task is: the hardest ordinary section, ★ or ★★ — shares, in config. */
export interface BossShares {
  readonly hard: number
  readonly star: number
  readonly twoStars: number
}

export const DEFAULT_BOSS_SHARES: BossShares = { hard: 0.5, star: 0.35, twoStars: 0.15 }

/**
 * Which of an ordinary format's N sections a level asks, as [from, to).
 *
 * Levels 1–5 each have their own band: the sections are cut into five in
 * order, and level k takes the k-th cut — sections ⌈(k−1)·N/5⌉+1 to ⌈k·N/5⌉.
 * A weak monster asks only the easy end, a strong one only the hard end.
 * With fewer than five sections a band would be empty, so it takes the
 * section at its edge: three sections give 1, 2, 2, 3, 3. The boss takes the
 * last section — the hardest the format has.
 */
export function sectionRange(level: Level, sectionCount: number): readonly [number, number] {
  if (!Number.isInteger(sectionCount) || sectionCount < 1) {
    throw new RangeError(`A format needs at least one section, not ${String(sectionCount)}`)
  }
  if (level === 'boss') return [sectionCount - 1, sectionCount]
  if (!Number.isInteger(level) || level < 1 || level > LEVELS) {
    throw new RangeError(`Levels run from 1 to ${String(LEVELS)}, not ${String(level)}`)
  }
  const to = Math.ceil((level * sectionCount) / LEVELS)
  const from = Math.min(Math.ceil(((level - 1) * sectionCount) / LEVELS), to - 1)
  return [from, to]
}

export interface Registry {
  /** One task for the step at the asker's tier. */
  generate(step: Step, tier: Tier, random: Random, weights?: ItemWeights): Task
  /**
   * One task of this format at this level — for the test stand and tests. A
   * starred format has no levels of its own: it gives any of its sections.
   */
  generateLevel(format: Format, level: Level, random: Random, weights?: ItemWeights): Task
  /** One task of exactly this section (0-based) — for the test stand and tests. */
  generateSection(format: Format, index: number, random: Random, weights?: ItemWeights): Task
}

export interface RegistryOptions {
  readonly bossShares?: BossShares
}

export function createRegistry(
  plugins: readonly TaskPlugin[],
  options: RegistryOptions = {},
): Registry {
  const shares = options.bossShares ?? DEFAULT_BOSS_SHARES
  const byId = new Map<string, TaskPlugin>()
  for (const plugin of plugins) {
    if (byId.has(plugin.id)) throw new Error(`Two plugins share the id '${plugin.id}'`)
    byId.set(plugin.id, plugin)
  }

  const fromSection = (
    format: Format,
    section: Section,
    random: Random,
    weights: ItemWeights | undefined,
  ): Task => {
    const plugin = byId.get(format.plugin)
    if (!plugin) throw new Error(`No known plugin '${format.plugin}'`)
    return plugin.generate(section.knobs, random, weights)
  }

  const generateLevel: Registry['generateLevel'] = (format, level, random, weights) => {
    const range =
      format.stars === undefined
        ? sectionRange(level, format.sections.length)
        : ([0, format.sections.length] as const)
    return fromSection(format, pick(random, format.sections.slice(...range)), random, weights)
  }

  /** The boss: hard, ★ or ★★ by their shares, among the kinds the step has. */
  const generateBoss = (step: Step, random: Random, weights: ItemWeights | undefined): Task => {
    const kinds = [
      { share: shares.hard, formats: step.formats.filter((f) => f.stars === undefined) },
      { share: shares.star, formats: step.formats.filter((f) => f.stars === 1) },
      { share: shares.twoStars, formats: step.formats.filter((f) => f.stars === 2) },
    ].filter((kind) => kind.formats.length > 0 && kind.share > 0)
    const total = kinds.reduce((sum, kind) => sum + kind.share, 0)
    let roll = random() * total
    const kind = kinds.find((k) => (roll -= k.share) < 0) ?? kinds.at(-1)
    if (!kind) throw new Error(`Step '${step.id}' has nothing for a boss to ask`)
    return generateLevel(pick(random, kind.formats), 'boss', random, weights)
  }

  return {
    generate(step, tier, random, weights) {
      if (tier === 'boss') return generateBoss(step, random, weights)
      const ordinary = step.formats.filter((f) => f.stars === undefined)
      if (ordinary.length === 0) throw new Error(`Step '${step.id}' has no ordinary formats`)
      return generateLevel(pick(random, ordinary), tier, random, weights)
    },
    generateLevel,
    generateSection(format, index, random, weights) {
      const section = format.sections[index]
      if (!section) {
        throw new RangeError(
          `Plugin '${format.plugin}' format has ${String(format.sections.length)} sections, not ${String(index + 1)}`,
        )
      }
      return fromSection(format, section, random, weights)
    },
  }
}
