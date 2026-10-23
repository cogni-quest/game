import { describe, expect, it } from 'vitest'

import {
  balanceOf,
  goldIn,
  MAX_COINS,
  PAID_KEY,
  QUEST_PROFILE_KEY,
  SHOP_LEDGER_KEY,
  sharedWallet,
  TEST_COINS_KEY,
  testWallet,
  withGold,
  type KeyValue,
} from './wallet'

function memory(initial: Record<string, unknown> = {}): KeyValue & { json(key: string): unknown } {
  const data = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    json: (key) => {
      const raw = data.get(key)
      return raw === undefined ? undefined : (JSON.parse(raw) as unknown)
    },
  }
}

const questSave = { version: 1, name: '', defeated: { orc: 3 }, gold: 40, battles: 3 }

describe('the balance, as the shop and the old Quest work it out', () => {
  it('is gold less what the shop spent, never below nothing nor past the ceiling', () => {
    expect(balanceOf(questSave, { spent: 25 })).toBe(15)
    expect(balanceOf(questSave, { spent: 90 })).toBe(0)
    expect(balanceOf(questSave, { spent: -10 })).toBe(50)
    expect(balanceOf({ version: 1, gold: 1e6 }, null)).toBe(MAX_COINS)
  })

  it('reads no gold from a save it does not know', () => {
    expect(goldIn(null)).toBe(0)
    expect(goldIn({ version: 2, gold: 50 })).toBe(0)
    expect(goldIn({ version: 1, gold: '50' })).toBe(0)
  })
})

describe('withGold', () => {
  it('adds to the old Quest’s gold and keeps the rest of its save', () => {
    expect(withGold(questSave, 5)).toEqual({ ...questSave, gold: 45 })
  })

  it('starts a save holding only the gold when there is none', () => {
    expect(withGold(null, 5)).toEqual({ version: 1, gold: 5 })
  })

  it('leaves a save it does not know alone', () => {
    expect(withGold({ version: 2, gold: 5 }, 5)).toBeNull()
    expect(withGold('junk', 5)).toBeNull()
  })
})

describe('sharedWallet', () => {
  it('shows what the shop shows, and pays into the old Quest’s gold', () => {
    const store = memory({ [QUEST_PROFILE_KEY]: questSave, [SHOP_LEDGER_KEY]: { spent: 30 } })
    const wallet = sharedWallet(store)
    const seen: number[] = []
    wallet.subscribe((b) => seen.push(b))

    expect(wallet.balance()).toBe(10)
    wallet.earn(4)
    expect(wallet.balance()).toBe(14)
    expect(seen).toEqual([14])
    expect(store.json(QUEST_PROFILE_KEY)).toEqual({ ...questSave, gold: 44 })
    expect(store.json(PAID_KEY)).toBe(4)
  })

  it('keeps gold the old Quest banked after the wallet was made', () => {
    const store = memory({ [QUEST_PROFILE_KEY]: questSave })
    const wallet = sharedWallet(store)
    store.setItem(QUEST_PROFILE_KEY, JSON.stringify({ ...questSave, gold: 60 }))
    wallet.earn(2)
    expect(goldIn(store.json(QUEST_PROFILE_KEY))).toBe(62)
  })

  it('pays nothing into a save it does not know, rather than overwrite it', () => {
    const foreign = { version: 7, gold: 3 }
    const store = memory({ [QUEST_PROFILE_KEY]: foreign })
    sharedWallet(store).earn(5)
    expect(store.json(QUEST_PROFILE_KEY)).toEqual(foreign)
    expect(store.json(PAID_KEY)).toBeUndefined()
  })
})

describe('testWallet', () => {
  it('keeps its own coins and never touches the real ones', () => {
    const store = memory({ [QUEST_PROFILE_KEY]: questSave, [TEST_COINS_KEY]: 7 })
    const wallet = testWallet(store)
    wallet.earn(3)
    expect(wallet.balance()).toBe(10)
    expect(store.json(TEST_COINS_KEY)).toBe(10)
    expect(store.json(QUEST_PROFILE_KEY)).toEqual(questSave)
  })
})
