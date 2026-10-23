import {
  attemptPolicyFor,
  DEFAULT_COIN_RULE,
  pick,
  startAttempts,
  systemRandom,
  type Attempts,
  type GameHost,
  type Task,
} from '@cogni/core'
import { allSteps, attention, logicPeterson, mathMoro, type Graph } from '@cogni/curriculum'
import type { ReactNode } from 'react'

import { hasOwnAnswer, registry, renderOwnAnswer, renderPrompt, spoken } from './registry'
import { SharedAnswer } from './SharedAnswer'
import type { Wallet } from './wallet'

const GRAPHS: Readonly<Record<string, Graph>> = {
  math: mathMoro,
  logic: logicPeterson,
  attention,
}

/**
 * Whose coins and progress a host keeps: the child's real ones, or the test
 * profile's (ARCHITECTURE.md, «Как дойти до переключения»).
 */
export interface Profile {
  readonly wallet: Wallet
  /** Prefix of the keys the games keep their own progress under. */
  readonly gameStateKey: string
}

function say(text: string): void {
  if (!('speechSynthesis' in window)) return
  // A new line cuts the old one off, so a repeat never queues behind it.
  speechSynthesis.cancel()
  const line = new SpeechSynthesisUtterance(text)
  line.lang = 'ru-RU'
  speechSynthesis.speak(line)
}

/**
 * The host a game gets on the stand. It stands in for what the core will do
 * once there is a program and a journal: any step of the subject, at the
 * game's tier, with the step's own tries. Coins go to the profile's wallet.
 */
export function createStandHost({ wallet, gameStateKey }: Profile): GameHost<ReactNode> {
  const attempts = new WeakMap<Task, Attempts<unknown>>()

  return {
    requestTasks({ count, tier, subject }) {
      const graph = GRAPHS[subject]
      if (!graph) throw new Error(`No graph for subject '${subject}'`)
      const steps = allSteps(graph)
      return Array.from({ length: count }, () => {
        const step = pick(systemRandom, steps)
        const task = registry.generate(step, tier, systemRandom)
        attempts.set(task, startAttempts(task.answer, attemptPolicyFor(step)))
        return task
      })
    },
    submit(task, given) {
      const tries = attempts.get(task)
      if (!tries) throw new Error('This task was not given by this host')
      return tries.submit(given)
    },
    loadGameState(gameId) {
      try {
        const stored = localStorage.getItem(`${gameStateKey}${gameId}`)
        return stored === null ? undefined : (JSON.parse(stored) as unknown)
      } catch {
        return undefined
      }
    },
    saveGameState(gameId, state) {
      try {
        localStorage.setItem(`${gameStateKey}${gameId}`, JSON.stringify(state))
      } catch {
        // Private windows refuse storage; the game still runs, it just forgets.
      }
    },
    coinsFor: (tier) => DEFAULT_COIN_RULE[tier],
    encounterWon(tier) {
      wallet.earn(DEFAULT_COIN_RULE[tier])
    },
    coins: () => wallet.balance(),
    onCoins: (handler) => wallet.subscribe(handler),
    renderPrompt,
    renderAnswer: (task, io) =>
      hasOwnAnswer(task) ? (
        renderOwnAnswer(task, io)
      ) : (
        <SharedAnswer key={task.itemKey} task={task} io={io} />
      ),
    speakTask: (task) => {
      say(spoken(task))
    },
    speak: say,
  }
}
