import { describe, expect, it } from 'vitest'

import { afterCatch, isOpen, readProgress, START, THIEVES } from './thieves'

describe('the wanted board', () => {
  it('has one thief per tier, weakest first, the boss last', () => {
    expect(THIEVES.map((t) => t.tier)).toEqual([1, 2, 3, 4, 5, 'boss'])
  })

  it('opens only the weakest thief at the start', () => {
    expect(THIEVES.filter((t) => isOpen(START, t.tier)).map((t) => t.tier)).toEqual([1])
  })

  it('opens the next thief when the strongest open one is caught, and only then', () => {
    expect(afterCatch(START, 1)).toEqual({ opened: 2 })
    expect(afterCatch({ opened: 3 }, 1)).toEqual({ opened: 3 })
    expect(afterCatch({ opened: 3 }, 3)).toEqual({ opened: 4 })
    expect(afterCatch({ opened: 6 }, 'boss')).toEqual({ opened: 6 })
    expect(isOpen(afterCatch({ opened: 5 }, 5), 'boss')).toBe(true)
  })

  it.each([undefined, null, 'x', {}, { opened: 'all' }, { opened: 1.5 }])(
    'starts over when the kept progress is missing or not ours: %j',
    (stored) => {
      expect(readProgress(stored)).toEqual(START)
    },
  )

  it('keeps kept progress within the board', () => {
    expect(readProgress({ opened: 4 })).toEqual({ opened: 4 })
    expect(readProgress({ opened: 99 })).toEqual({ opened: THIEVES.length })
    expect(readProgress({ opened: 0 })).toEqual({ opened: 1 })
  })
})
