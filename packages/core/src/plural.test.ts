import { describe, expect, it } from 'vitest'

import { counted, type Forms } from './plural'

const APPLE: Forms = ['яблоко', 'яблока', 'яблок']

describe('counted', () => {
  it.each([
    [1, '1 яблоко'],
    [2, '2 яблока'],
    [5, '5 яблок'],
    [11, '11 яблок'],
    [12, '12 яблок'],
    [21, '21 яблоко'],
    [24, '24 яблока'],
    [0, '0 яблок'],
  ])('%i', (count, said) => {
    expect(counted(count, APPLE)).toBe(said)
  })
})
