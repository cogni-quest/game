import { describe, expect, it } from 'vitest'

import { pathOf, routeOf } from './routes'

const GAMES = ['detective']

describe('routeOf', () => {
  it.each([
    ['/', '/', { page: 'menu' }],
    ['/detective', '/', { page: 'game', id: 'detective' }],
    ['/detective/', '/', { page: 'game', id: 'detective' }],
    ['/test', '/', { page: 'stand' }],
    ['/admin', '/', { page: 'stand' }],
    ['/kings-bounty', '/', { page: 'missing' }],
    ['/game/', '/game/', { page: 'menu' }],
    ['/game/detective', '/game/', { page: 'game', id: 'detective' }],
    ['/game/admin', '/game/', { page: 'stand' }],
  ] as const)('%s under %s opens %j', (path, base, route) => {
    expect(routeOf(path, base, GAMES)).toEqual(route)
  })
})

describe('pathOf', () => {
  it('gives each page its address under the base, and back again', () => {
    for (const base of ['/', '/game/', '/game']) {
      for (const route of [
        { page: 'menu' },
        { page: 'game', id: 'detective' },
        { page: 'stand' },
      ] as const) {
        expect(routeOf(pathOf(route, base), base.endsWith('/') ? base : `${base}/`, GAMES)).toEqual(
          route,
        )
      }
    }
  })
})
