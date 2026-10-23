import type { GamePlugin } from '@cogni/core'
import { detectiveGame } from '@cogni/game-detective'
import type { ReactNode } from 'react'

import { createStandHost, type Profile } from './host'
import { browserStore, sharedWallet, testWallet } from './wallet'

/** Every game the child can pick, in the menu's order. Adding one is a line here. */
export const GAMES: readonly GamePlugin<ReactNode>[] = [detectiveGame]

/**
 * The built site — what the child opens — plays for real: its coins are the
 * ones the old Quest and «Лавка чудес» show. The dev server plays on the test
 * profile and never touches them.
 */
const store = browserStore()
const PROFILE: Profile = import.meta.env.PROD
  ? { wallet: sharedWallet(store), gameStateKey: 'cogni:game:' }
  : { wallet: testWallet(store), gameStateKey: 'cogni:test-profile:game:' }

/** One host for the page's whole life. */
export const host = createStandHost(PROFILE)

/** The shop the coins are spent in; it shares this site's origin. */
export const SHOP_URL = 'https://cogni-quest.github.io/magic-shop/'
