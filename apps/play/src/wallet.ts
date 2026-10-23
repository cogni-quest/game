/**
 * Where the coins live. Two kinds, chosen by the build:
 *
 * - **the shared wallet** — the child's real coins, the same ones the old
 *   Quest and «Лавка чудес» show. All three sites share one origin
 *   (`cogni-quest.github.io`) and so one `localStorage`. The shop works the
 *   balance out on every read as `quest:profile.gold − magicshop:ledger.spent`
 *   (magic-shop `core/wallet.ts`); the old Quest shows the same. So this game
 *   adds what it pays to `quest:profile.gold`, the one place the shop reads
 *   earnings from, and reads the balance the same way. Neither of them is
 *   changed (ARCHITECTURE.md, «Монеты и магазин»).
 * - **the test wallet** — its own key, for the dev server, which never
 *   touches a real coin.
 *
 * One caveat, by the old Quest's design: it reads its profile once when it
 * opens and writes the whole of it back after a battle. Coins paid here while
 * an old Quest tab is open are lost when that tab saves. The old address is
 * redirected here at the switch, so this lasts only as long as both are played.
 */
export interface Wallet {
  balance(): number
  earn(coins: number): void
  /** Called with the new balance on every change, here or in another tab. */
  subscribe(handler: (balance: number) => void): () => void
}

/** The shop's ceiling, kept the same so both show the same number. */
export const MAX_COINS = 9999

export const QUEST_PROFILE_KEY = 'quest:profile'
export const SHOP_LEDGER_KEY = 'magicshop:ledger'
/** What this game has paid into the shared wallet, all told: a record of our own side. */
export const PAID_KEY = 'cogni:wallet:paid'
export const TEST_COINS_KEY = 'cogni:test-profile:coins'

const clamp = (n: number) => Math.min(Math.max(Math.round(n), 0), MAX_COINS)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** The gold the old Quest holds, as the shop reads it: a version-1 save's `gold`, else nothing. */
export function goldIn(profile: unknown): number {
  return isRecord(profile) && profile['version'] === 1 && typeof profile['gold'] === 'number'
    ? profile['gold']
    : 0
}

/** What the shop says was spent; may be negative, as the shop allows. */
export function spentIn(ledger: unknown): number {
  return isRecord(ledger) && typeof ledger['spent'] === 'number' ? ledger['spent'] : 0
}

/** The balance every site shows: gold less spending, never below nothing. */
export function balanceOf(profile: unknown, ledger: unknown): number {
  return clamp(goldIn(profile) - spentIn(ledger))
}

/**
 * The old Quest's save with `coins` more gold, everything else as it was —
 * or a fresh save holding only them, which the old Quest reads with its
 * defaults. Null for a save that is there but not one it knows: that is the
 * old Quest's to deal with, and overwriting it would lose the child's game.
 */
export function withGold(profile: unknown, coins: number): Record<string, unknown> | null {
  if (profile === null || profile === undefined) return { version: 1, gold: coins }
  if (!isRecord(profile) || profile['version'] !== 1) return null
  return { ...profile, gold: goldIn(profile) + coins }
}

/** The part of `Storage` the wallets use, so tests can hand them a map. */
export type KeyValue = Pick<Storage, 'getItem' | 'setItem'>

/**
 * The browser's storage, or a map for this page's life when even reaching it
 * throws, as it can in a private window: the game plays on and only forgets.
 */
export function browserStore(): KeyValue {
  try {
    return window.localStorage
  } catch {
    const data = new Map<string, string>()
    return {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value)
      },
    }
  }
}

function read(store: KeyValue, key: string): unknown {
  try {
    const raw = store.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function write(store: KeyValue, key: string, value: unknown): boolean {
  try {
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Calls back on a change of any of `keys` made by another tab. */
function watch(keys: readonly string[], callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || keys.includes(event.key)) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('storage', onStorage)
  }
}

export function sharedWallet(store: KeyValue): Wallet {
  const listeners = new Set<(balance: number) => void>()
  const balance = () => balanceOf(read(store, QUEST_PROFILE_KEY), read(store, SHOP_LEDGER_KEY))
  const tell = () => {
    const now = balance()
    for (const listener of listeners) listener(now)
  }
  let unwatch: (() => void) | null = null

  return {
    balance,
    earn(coins) {
      // Read just before writing, so gold the old Quest banked a moment ago is kept.
      const next = withGold(read(store, QUEST_PROFILE_KEY), coins)
      if (next && write(store, QUEST_PROFILE_KEY, next)) {
        const paid = read(store, PAID_KEY)
        write(store, PAID_KEY, (typeof paid === 'number' ? paid : 0) + coins)
      }
      tell()
    },
    subscribe(handler) {
      listeners.add(handler)
      unwatch ??= watch([QUEST_PROFILE_KEY, SHOP_LEDGER_KEY], tell)
      return () => {
        listeners.delete(handler)
        if (listeners.size === 0 && unwatch) {
          unwatch()
          unwatch = null
        }
      }
    },
  }
}

export function testWallet(store: KeyValue): Wallet {
  const listeners = new Set<(balance: number) => void>()
  const stored = read(store, TEST_COINS_KEY)
  let coins = typeof stored === 'number' ? clamp(stored) : 0
  return {
    balance: () => coins,
    earn(more) {
      coins = clamp(coins + more)
      write(store, TEST_COINS_KEY, coins)
      for (const listener of listeners) listener(coins)
    },
    subscribe(handler) {
      listeners.add(handler)
      return () => {
        listeners.delete(handler)
      }
    },
  }
}
