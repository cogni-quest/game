import { describe, expect, it } from 'vitest'

import {
  afterAssembly,
  isOpen,
  MODULES,
  readProgress,
  ROBOTS,
  shown,
  START,
  tipFor,
  TIPS,
} from './workshop'

describe('the workshop', () => {
  it('has one robot per tier, simplest first, the boss last, each its own name', () => {
    expect(ROBOTS.map((r) => r.tier)).toEqual([1, 2, 3, 4, 5, 'boss'])
    expect(new Set(ROBOTS.map((r) => r.name)).size).toBe(ROBOTS.length)
  })

  it('builds a robot of three modules, and has tips to give', () => {
    expect(MODULES).toHaveLength(3)
    expect(TIPS.length).toBeGreaterThan(MODULES.length)
  })

  it('gives every tip in turn, then starts over', () => {
    const given = Array.from({ length: TIPS.length * 2 }, (_, i) => tipFor(i))
    expect(new Set(given).size).toBe(TIPS.length)
    expect(tipFor(TIPS.length)).toBe(tipFor(0))
  })

  it('opens only the simplest robot at the start', () => {
    expect(ROBOTS.filter((r) => isOpen(START, r.tier)).map((r) => r.tier)).toEqual([1])
  })

  it('opens the next robot when the strongest open one is assembled, and only then', () => {
    expect(afterAssembly(START, 1)).toEqual({ opened: 2 })
    expect(afterAssembly({ opened: 3 }, 1)).toEqual({ opened: 3 })
    expect(afterAssembly({ opened: 3 }, 3)).toEqual({ opened: 4 })
    expect(afterAssembly({ opened: 6 }, 'boss')).toEqual({ opened: 6 })
    expect(isOpen(afterAssembly({ opened: 5 }, 5), 'boss')).toBe(true)
  })

  it.each([undefined, null, 'x', {}, { opened: 'all' }, { opened: 1.5 }])(
    'starts over when the kept progress is missing or not ours: %j',
    (stored) => {
      expect(readProgress(stored)).toEqual(START)
    },
  )

  it('shows every robot open with ?all in the address, and only then', () => {
    expect(shown(START, '?all')).toEqual({ opened: ROBOTS.length })
    expect(shown(START, '?x=1&all=1')).toEqual({ opened: ROBOTS.length })
    expect(shown(START, '')).toEqual(START)
    expect(shown({ opened: 3 }, '?allow')).toEqual({ opened: 3 })
  })

  it('keeps kept progress within the workshop', () => {
    expect(readProgress({ opened: 4 })).toEqual({ opened: 4 })
    expect(readProgress({ opened: 99 })).toEqual({ opened: ROBOTS.length })
    expect(readProgress({ opened: 0 })).toEqual({ opened: 1 })
  })
})
