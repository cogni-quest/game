import { sectionRange, type Level, type Tier } from '@cogni/core'
import type { CurriculumFormat, CurriculumSection } from '@cogni/curriculum'

/** What the stand calls a format: its title, or the plugin when it has none. */
export function formatLabel(format: CurriculumFormat, index: number): string {
  return format.title ?? `${format.plugin} ${String(index + 1)}`
}

/** The levels a format has: 1–5 and the boss's, or only the boss's when it is starred. */
export function levelsOf(format: CurriculumFormat): readonly Level[] {
  return format.stars === undefined ? LEVELS_SHOWN : ['boss']
}

/** What the stand calls a section: its title, or its number when it has none. */
export function sectionLabel(section: CurriculumSection, index: number): string {
  const name = section.title ?? `раздел ${String(index + 1)}`
  return section.source === undefined ? name : `${name} (${section.source})`
}

/** The sections a level asks, by name; a starred format is asked whole, by the boss. */
export function levelContents(format: CurriculumFormat, level: Level): string {
  const [from, to] =
    format.stars === undefined
      ? sectionRange(level, format.sections.length)
      : [0, format.sections.length]
  return format.sections
    .slice(from, to)
    .map((section, i) => sectionLabel(section, from + i))
    .join(', ')
}

/** Levels 1–5 and the boss's, in the order the stand shows them. */
export const LEVELS_SHOWN: readonly Level[] = [1, 2, 3, 4, 5, 'boss']

export function levelLabel(level: Level): string {
  return level === 'boss' ? 'Босс' : `Уровень ${String(level)}`
}

export const TIERS: readonly Tier[] = LEVELS_SHOWN

export function tierLabel(tier: Tier): string {
  return tier === 'boss' ? 'босс' : `уровень монстра ${String(tier)}`
}
