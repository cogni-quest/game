import {
  chance,
  numberAnswer,
  pick,
  randomInt,
  type NumberAnswer,
  type Random,
  type Task,
} from '@cogni/core'

import type { AdditionKnobs, Operation, Show } from './knobs'

export interface AdditionPrompt {
  readonly left: number
  readonly right: number
  readonly operation: Operation
  /** One example, shown one of three ways; the item is the same either way. */
  readonly show: Show
}

export type AdditionTask = Task<AdditionPrompt, NumberAnswer>

export const PLUGIN_ID = 'addition'

/** Narrows a task the core hands over by the plugin that made it. */
export function isAdditionTask(task: Task): task is AdditionTask {
  return task.pluginId === PLUGIN_ID
}

/**
 * One task of the section, built to its rule — never «generate and check»:
 * nothing is drawn and thrown away, so the generator cannot spin and always
 * lands inside the rule.
 */
export function generateAddition(knobs: AdditionKnobs, random: Random): AdditionTask {
  const task = build(knobs, random)
  const show = knobs.show ?? mixed(task.prompt, random)
  return { ...task, prompt: { ...task.prompt, show } }
}

/** Counters fit in ten-frames up to this many. */
export const PICTURE_UP_TO = 20

/** Half in digits; the rest in pictures where the numbers fit, else in words. */
function mixed({ left, right }: AdditionPrompt, random: Random): Show {
  const roll = random()
  if (roll < 1 / 2) return 'digits'
  const fits = Math.max(left, right, left + right) <= PICTURE_UP_TO
  return fits && roll < 3 / 4 ? 'picture' : 'words'
}

function build(knobs: AdditionKnobs, random: Random): AdditionTask {
  const plus = knobs.operation === '+'
  switch (knobs.kind) {
    case 'within-10':
      return plus ? addWithinTen(random, knobs) : subtractWithinTen(random, knobs)
    case 'cross-ten':
      return plus
        ? addAcrossTheTen(random, knobs.second)
        : subtractAcrossTheTen(random, knobs.minuend)
    case 'round-tens':
      return plus ? addRoundTens(random) : subtractRoundTens(random)
    case 'two-digit-ones':
      return plus ? addOnes(random) : subtractOnes(random)
    case 'two-digit-tens':
      return plus ? addTens(random) : subtractTens(random)
    case 'two-digit':
      return plus ? addByPlace(random) : subtractByPlace(random)
    case 'to-round':
      return plus ? addToRound(random) : subtractFromRound(random)
    case 'ones-carry':
      return plus ? addOnesCarrying(random) : subtractOnesBorrowing(random)
    case 'two-digit-carry':
      return plus ? addAcrossPlace(random) : subtractAcrossPlace(random)
    case 'round-hundreds':
      return plus ? addRoundHundreds(random) : subtractRoundHundreds(random)
    case 'hundreds-tens':
      return plus ? addTensToHundreds(random) : subtractTensFromHundreds(random)
    case 'tens-carry':
      return plus ? addTensCarrying(random) : subtractTensBorrowing(random)
    case 'three-digit-round':
      return plus ? addRoundThreeDigit(random) : subtractRoundThreeDigit(random)
    case 'three-digit':
      return plus ? addThreeDigit(random) : subtractThreeDigit(random)
  }
}

/**
 * The highest number the child might plausibly say, right or wrong — the range
 * of the voice grammar and of the pad. Within ten it must not stop at five: a
 * voice grammar of six words is one Vosk hears in anything at all.
 */
const WITHIN_TEN = 10
const WITHIN_TWENTY = 20
const WITHIN_HUNDRED = 100
const WITHIN_THOUSAND = 1000

/**
 * How often the whole table within ten brings a zero — «4 + 0», «4 − 0»,
 * «4 − 4». Facts a child has to meet, but rare enough never to be a way of
 * answering.
 */
const ZERO_CHANCE = 1 / 20

function makeTask(left: number, right: number, operation: Operation, upTo: number): AdditionTask {
  const expected = operation === '+' ? left + right : left - right
  return {
    pluginId: PLUGIN_ID,
    itemKey: `${String(left)}${operation}${String(right)}`,
    prompt: { left, right, operation, show: 'digits' },
    answer: numberAnswer(expected, upTo),
  }
}

/** Not always the larger number first, or the child learns the shape of the line. */
function eitherOrder(random: Random, a: number, b: number): readonly [number, number] {
  return chance(random, 1 / 2) ? [a, b] : [b, a]
}

type WithinTen = Extract<AdditionKnobs, { kind: 'within-10' }>

/**
 * «5 + 1» with `second`, «2 + 7» with `secondFrom` — the small number first,
 * added by swapping round — «4 + 0» with `zero`. With none of them, the whole
 * table, both orders, and a zero now and then.
 */
function addWithinTen(random: Random, { second, secondFrom, zero }: WithinTen): AdditionTask {
  // Adding nothing is a fact about zero; «0 + 0» is not — it is nothing at all.
  const zeroFact = () => makeTask(randomInt(random, 1, 9), 0, '+', WITHIN_TEN)
  if (zero === true) return zeroFact()
  if (second !== undefined || secondFrom !== undefined) {
    const right = second ?? randomInt(random, secondFrom ?? 1, 9)
    return makeTask(randomInt(random, 1, 10 - right), right, '+', WITHIN_TEN)
  }
  if (chance(random, ZERO_CHANCE)) return zeroFact()
  const small = randomInt(random, 1, 9)
  const [left, right] = eitherOrder(random, randomInt(random, 1, 10 - small), small)
  return makeTask(left, right, '+', WITHIN_TEN)
}

/**
 * «5 − 1» with `second`, «9 − 6» with `secondFrom` — through the parts of the
 * number — «4 − 0», «4 − 4» with `zero`. Something is left, except in the zero
 * facts. With none of them, the whole table and a zero now and then.
 */
function subtractWithinTen(random: Random, { second, secondFrom, zero }: WithinTen): AdditionTask {
  const zeroFact = () => {
    const left = randomInt(random, 1, 9)
    return makeTask(left, chance(random, 1 / 2) ? 0 : left, '-', WITHIN_TEN)
  }
  if (zero === true) return zeroFact()
  if (second === undefined && secondFrom === undefined && chance(random, ZERO_CHANCE)) {
    return zeroFact()
  }
  const right = second ?? randomInt(random, secondFrom ?? 1, 9)
  return makeTask(randomInt(random, right + 1, 10), right, '-', WITHIN_TEN)
}

/**
 * «9 + 2»: the sum crosses the ten. With `second`, the textbook's «□ + k»: the
 * number added is k, written second. Without it, the whole table, both orders.
 */
function addAcrossTheTen(random: Random, second: number | undefined): AdditionTask {
  const right = second ?? randomInt(random, 2, 9)
  const left = randomInt(random, 11 - right, 9)
  const [a, b] = second === undefined ? eitherOrder(random, left, right) : [left, right]
  return makeTask(a, b, '+', WITHIN_TWENTY)
}

/**
 * «11 − 3»: the units fall short, so a ten is broken open. With `minuend`, the
 * textbook's «m − □». Without it, any first number from 11 to 18.
 */
function subtractAcrossTheTen(random: Random, minuend: number | undefined): AdditionTask {
  const left = minuend ?? randomInt(random, 11, 18)
  return makeTask(left, randomInt(random, (left % 10) + 1, 9), '-', WITHIN_TWENTY)
}

/** «30 + 40»: three tens and four tens; a hundred at most. */
function addRoundTens(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 9)
  const rightTens = randomInt(random, 1, 10 - leftTens)
  return makeTask(leftTens * 10, rightTens * 10, '+', WITHIN_HUNDRED)
}

/** «70 − 40», with a ten always left standing. */
function subtractRoundTens(random: Random): AdditionTask {
  const leftTens = randomInt(random, 2, 10)
  const rightTens = randomInt(random, 1, leftTens - 1)
  return makeTask(leftTens * 10, rightTens * 10, '-', WITHIN_HUNDRED)
}

/** «36 + 2»: a one-digit number, the units do not overflow. */
function addOnes(random: Random): AdditionTask {
  const units = randomInt(random, 1, 8)
  const left = randomInt(random, 1, 9) * 10 + units
  return makeTask(left, randomInt(random, 1, 9 - units), '+', WITHIN_HUNDRED)
}

/** «36 − 2»: a one-digit number taken from the units, no borrowing. */
function subtractOnes(random: Random): AdditionTask {
  const units = randomInt(random, 1, 9)
  const left = randomInt(random, 1, 9) * 10 + units
  return makeTask(left, randomInt(random, 1, units), '-', WITHIN_HUNDRED)
}

/** «36 + 20»: whole tens added, the units untouched. */
function addTens(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 8)
  const left = leftTens * 10 + randomInt(random, 1, 9)
  return makeTask(left, randomInt(random, 1, 9 - leftTens) * 10, '+', WITHIN_HUNDRED)
}

/** «36 − 20»: whole tens taken away, the units untouched. */
function subtractTens(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 9)
  const left = leftTens * 10 + randomInt(random, 1, 9)
  return makeTask(left, randomInt(random, 1, leftTens) * 10, '-', WITHIN_HUNDRED)
}

/**
 * «45 + 23»: units have room for each other and so do tens. The two units are
 * never both zero — «30 + 40» is `round-tens`.
 */
function addByPlace(random: Random): AdditionTask {
  const leftUnits = randomInt(random, 0, 8)
  const rightUnits = randomInt(random, leftUnits === 0 ? 1 : 0, 9 - leftUnits)
  const leftTens = randomInt(random, 1, 8)
  // The second number must not come out as zero, so with no units it needs tens.
  const rightTens = randomInt(random, rightUnits === 0 ? 1 : 0, 9 - leftTens)
  return makeTask(leftTens * 10 + leftUnits, rightTens * 10 + rightUnits, '+', WITHIN_HUNDRED)
}

/**
 * «68 − 14»: every digit taken away fits under its own. The first number always
 * has units, which keeps «70 − 40» in `round-tens`. The legal subtrahends are
 * enumerated and one is drawn — bounded work, uniform, nothing thrown away.
 */
function subtractByPlace(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 9)
  const leftUnits = randomInt(random, 1, 9)
  const left = leftTens * 10 + leftUnits

  const candidates: number[] = []
  for (let takenTens = 0; takenTens <= leftTens; takenTens++) {
    for (let takenUnits = 0; takenUnits <= leftUnits; takenUnits++) {
      const right = takenTens * 10 + takenUnits
      if (right >= 1 && right < left) candidates.push(right)
    }
  }

  return makeTask(left, pick(random, candidates), '-', WITHIN_HUNDRED)
}

/** «26 + 4»: the units make exactly ten, and the sum is whole tens. */
function addToRound(random: Random): AdditionTask {
  const units = randomInt(random, 1, 9)
  const left = randomInt(random, 1, 8) * 10 + units
  return makeTask(left, 10 - units, '+', WITHIN_HUNDRED)
}

/** «30 − 7»: a one-digit number from whole tens, so a ten is broken open. */
function subtractFromRound(random: Random): AdditionTask {
  return makeTask(randomInt(random, 2, 10) * 10, randomInt(random, 1, 9), '-', WITHIN_HUNDRED)
}

/** «26 + 7»: a one-digit number carries past whole tens. */
function addOnesCarrying(random: Random): AdditionTask {
  const units = randomInt(random, 2, 9)
  const left = randomInt(random, 1, 8) * 10 + units
  return makeTask(left, randomInt(random, 11 - units, 9), '+', WITHIN_HUNDRED)
}

/** «35 − 7»: a one-digit number larger than the units, so a ten is broken open. */
function subtractOnesBorrowing(random: Random): AdditionTask {
  const units = randomInt(random, 1, 8)
  const left = randomInt(random, 2, 9) * 10 + units
  return makeTask(left, randomInt(random, units + 1, 9), '-', WITHIN_HUNDRED)
}

/** «47 + 28»: the units overflow and a ten is carried; 98 at most. */
function addAcrossPlace(random: Random): AdditionTask {
  const leftUnits = randomInt(random, 1, 9)
  const rightUnits = randomInt(random, 10 - leftUnits, 9)
  // The tens must hold the ten carried from below: leftTens + rightTens + 1 <= 9.
  const leftTens = randomInt(random, 1, 8)
  const rightTens = randomInt(random, 0, 8 - leftTens)
  return makeTask(leftTens * 10 + leftUnits, rightTens * 10 + rightUnits, '+', WITHIN_HUNDRED)
}

/**
 * «63 − 27»: the units above are too few, so a ten is broken open. At least two
 * tens up top, or this would be `cross-ten` under another name.
 */
function subtractAcrossPlace(random: Random): AdditionTask {
  const leftUnits = randomInt(random, 0, 8)
  const rightUnits = randomInt(random, leftUnits + 1, 9)
  const leftTens = randomInt(random, 2, 9)
  const rightTens = randomInt(random, 0, leftTens - 1)
  return makeTask(leftTens * 10 + leftUnits, rightTens * 10 + rightUnits, '-', WITHIN_HUNDRED)
}

/** «300 + 200»: whole hundreds; a thousand at most. */
function addRoundHundreds(random: Random): AdditionTask {
  const left = randomInt(random, 1, 9)
  return makeTask(left * 100, randomInt(random, 1, 10 - left) * 100, '+', WITHIN_THOUSAND)
}

/** «500 − 200», with a hundred always left standing. */
function subtractRoundHundreds(random: Random): AdditionTask {
  const left = randomInt(random, 2, 10)
  return makeTask(left * 100, randomInt(random, 1, left - 1) * 100, '-', WITHIN_THOUSAND)
}

/** «450 + 30»: whole tens added to hundreds and tens, the hundreds untouched. */
function addTensToHundreds(random: Random): AdditionTask {
  const tens = randomInt(random, 1, 8)
  const left = randomInt(random, 1, 9) * 100 + tens * 10
  return makeTask(left, randomInt(random, 1, 9 - tens) * 10, '+', WITHIN_THOUSAND)
}

/** «480 − 30»: whole tens taken from the tens, the hundreds untouched. */
function subtractTensFromHundreds(random: Random): AdditionTask {
  const tens = randomInt(random, 1, 9)
  const left = randomInt(random, 1, 9) * 100 + tens * 10
  return makeTask(left, randomInt(random, 1, tens) * 10, '-', WITHIN_THOUSAND)
}

/** «470 + 80»: the tens overflow into the next hundred. */
function addTensCarrying(random: Random): AdditionTask {
  const tens = randomInt(random, 2, 9)
  const left = randomInt(random, 1, 8) * 100 + tens * 10
  return makeTask(left, randomInt(random, 11 - tens, 9) * 10, '+', WITHIN_THOUSAND)
}

/** «560 − 90»: more tens taken than there are, so a hundred is broken open. */
function subtractTensBorrowing(random: Random): AdditionTask {
  const tens = randomInt(random, 1, 8)
  const left = randomInt(random, 2, 9) * 100 + tens * 10
  return makeTask(left, randomInt(random, tens + 1, 9) * 10, '-', WITHIN_THOUSAND)
}

/** «260 + 310»: three-digit whole tens, place by place, nothing carried. */
function addRoundThreeDigit(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 8)
  const leftHundreds = randomInt(random, 1, 8)
  const left = leftHundreds * 100 + leftTens * 10
  const right =
    randomInt(random, 1, 9 - leftHundreds) * 100 + randomInt(random, 1, 9 - leftTens) * 10
  return makeTask(left, right, '+', WITHIN_THOUSAND)
}

/** «670 − 140»: three-digit whole tens, nothing borrowed. */
function subtractRoundThreeDigit(random: Random): AdditionTask {
  const leftTens = randomInt(random, 1, 9)
  const leftHundreds = randomInt(random, 2, 9)
  const left = leftHundreds * 100 + leftTens * 10
  const right = randomInt(random, 1, leftHundreds - 1) * 100 + randomInt(random, 1, leftTens) * 10
  return makeTask(left, right, '-', WITHIN_THOUSAND)
}

/** Any three-digit sum up to 999, carrying or not. */
function addThreeDigit(random: Random): AdditionTask {
  const left = randomInt(random, 101, 898)
  return makeTask(left, randomInt(random, 11, 999 - left), '+', WITHIN_THOUSAND)
}

/** Any three-digit difference, borrowing or not, something always left. */
function subtractThreeDigit(random: Random): AdditionTask {
  const left = randomInt(random, 120, 999)
  return makeTask(left, randomInt(random, 11, left - 1), '-', WITHIN_THOUSAND)
}
