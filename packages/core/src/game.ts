import type { Outcome } from './attempts'
import type { Tier } from './registry'
import type { AnswerIO, Task } from './task'

/** A subject — 'math', 'logic', 'attention' — never a topic: topics are the core's to choose. */
export type SubjectId = string

/** Where an answer came from; the analytics split accuracy by it. */
export type InputSource = 'voice' | 'pad' | 'voice-edited' | 'tap'

export interface TaskRequest {
  readonly count: number
  readonly tier: Tier
  readonly subject: SubjectId
}

/**
 * What the core gives a game (ARCHITECTURE.md, «Плагин игры»). The game asks
 * how many tasks and how hard, draws them through the host without seeing
 * inside, and draws the consequences of each `Outcome`. Coins are the core's:
 * the game only says an encounter was won.
 */
export interface GameHost<Rendered> {
  requestTasks(request: TaskRequest): readonly Task[]
  submit(task: Task, given: unknown, input: InputSource): Outcome<unknown>
  /** The game's encounter is won; the core pays for it by its tier. */
  encounterWon(tier: Tier): void
  /** What a won encounter of this tier pays, so the game can promise it up front. */
  coinsFor(tier: Tier): number
  coins(): number
  /** Called with the new balance whenever it changes; returns the way to stop. */
  onCoins(handler: (balance: number) => void): () => void
  renderPrompt(task: Task): Rendered
  /** The plugin's own answer form, or the shared one for its shape. */
  renderAnswer(task: Task, io: AnswerIO): Rendered
  /**
   * The game's own progress — which thieves are open, which island is
   * cleared — kept by the host, so the game never picks the storage. Data,
   * checked by the game on the way back in; undefined before the first save.
   */
  loadGameState(gameId: string): unknown
  saveGameState(gameId: string, state: unknown): void
  /** Reads the task aloud, as its plugin says it. */
  speakTask(task: Task): void
  /** Reads the game's own line aloud: «Воришка убежал!». */
  speak(text: string): void
}

/** A game: what it is called, and how it draws itself around a host. */
export interface GamePlugin<Rendered> {
  readonly id: string
  readonly title: string
  /** One line under the title in the menu: what the game is about. */
  readonly description: string
  /** The subject whose tasks it asks. */
  readonly subject: SubjectId
  /** Its picture on the card the child picks it by. */
  cover(): Rendered
  render(host: GameHost<Rendered>): Rendered
}

/**
 * Coins for a won encounter, by its tier: a stronger one pays more, as in the
 * old game, and the boss most. Revisited once real data on the pace is in
 * (ARCHITECTURE.md, «Экономика»).
 */
export type CoinRule = Readonly<Record<Tier, number>>

export const DEFAULT_COIN_RULE: CoinRule = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, boss: 10 }
