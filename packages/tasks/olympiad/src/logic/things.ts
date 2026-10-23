import type { Forms } from '@cogni/core'

export type ThingId = 'pumpkin' | 'watermelon' | 'melon' | 'pineapple' | 'pear' | 'apple' | 'plum'

export interface Thing {
  readonly id: ThingId
  /** After one, two and five: арбуз, арбуза, арбузов. */
  readonly names: Forms
  readonly colour: string
}

/** From the heaviest to the lightest, so a swap always trades one for several. */
export const THINGS: readonly Thing[] = [
  { id: 'pumpkin', names: ['тыква', 'тыквы', 'тыкв'], colour: '#e8833a' },
  { id: 'watermelon', names: ['арбуз', 'арбуза', 'арбузов'], colour: '#3a7d44' },
  { id: 'melon', names: ['дыня', 'дыни', 'дынь'], colour: '#e5c14a' },
  { id: 'pineapple', names: ['ананас', 'ананаса', 'ананасов'], colour: '#c9a227' },
  { id: 'pear', names: ['груша', 'груши', 'груш'], colour: '#a6c34c' },
  { id: 'apple', names: ['яблоко', 'яблока', 'яблок'], colour: '#c94c3c' },
  { id: 'plum', names: ['слива', 'сливы', 'слив'], colour: '#7a4c9c' },
]

export function thing(id: ThingId): Thing {
  const found = THINGS.find((t) => t.id === id)
  if (!found) throw new RangeError(`No thing '${id}'`)
  return found
}
