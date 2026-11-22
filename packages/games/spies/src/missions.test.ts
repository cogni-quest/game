import { describe, expect, it } from 'vitest'

import {
  afterMission,
  HOUSES,
  isOpen,
  MISSIONS,
  readProgress,
  shown,
  START,
  tipFor,
  TIPS,
} from './missions'

describe('the agency', () => {
  it('has one mission per tier, simplest first, the boss last, each its own leader', () => {
    expect(MISSIONS.map((m) => m.tier)).toEqual([1, 2, 3, 4, 5, 'boss'])
    expect(new Set(MISSIONS.map((m) => m.codename)).size).toBe(MISSIONS.length)
  })

  it('sends the child to three houses a mission, with a tip for more than one mission', () => {
    expect(HOUSES).toBe(3)
    expect(TIPS.length).toBeGreaterThan(HOUSES)
  })

  it('gives every tip in turn, then starts over', () => {
    const given = Array.from({ length: TIPS.length * 2 }, (_, i) => tipFor(i))
    expect(new Set(given).size).toBe(TIPS.length)
    expect(tipFor(TIPS.length)).toBe(tipFor(0))
  })

  it('never marks left and right for the child: no tip says which hand', () => {
    expect(TIPS.filter((tip) => /рук|Л\b|П\b/.test(tip))).toEqual([])
  })

  it('opens only the simplest mission at the start', () => {
    expect(MISSIONS.filter((m) => isOpen(START, m.tier)).map((m) => m.tier)).toEqual([1])
  })

  it('opens the next mission when the hardest open one is done, and only then', () => {
    expect(afterMission(START, 1)).toEqual({ opened: 2 })
    expect(afterMission({ opened: 3 }, 1)).toEqual({ opened: 3 })
    expect(afterMission({ opened: 3 }, 3)).toEqual({ opened: 4 })
    expect(afterMission({ opened: 6 }, 'boss')).toEqual({ opened: 6 })
    expect(isOpen(afterMission({ opened: 5 }, 5), 'boss')).toBe(true)
  })

  it.each([undefined, null, 'x', {}, { opened: 'all' }, { opened: 1.5 }])(
    'starts over when the kept progress is missing or not ours: %j',
    (stored) => {
      expect(readProgress(stored)).toEqual(START)
    },
  )

  it('keeps kept progress within the agency', () => {
    expect(readProgress({ opened: 4 })).toEqual({ opened: 4 })
    expect(readProgress({ opened: 99 })).toEqual({ opened: MISSIONS.length })
    expect(readProgress({ opened: 0 })).toEqual({ opened: 1 })
  })

  it('shows every mission open with ?all in the address, and only then', () => {
    expect(shown(START, '?all')).toEqual({ opened: MISSIONS.length })
    expect(shown(START, '')).toEqual(START)
    expect(shown({ opened: 3 }, '?allow')).toEqual({ opened: 3 })
  })
})
