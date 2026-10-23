/**
 * Which page an address opens. The child's door is the menu at the root; the
 * stand, where tasks are checked before the child sees them, is behind
 * `/test` or `/admin` (ARCHITECTURE.md, «Экран родителя»). No router: a page
 * is a full load, and links are plain links.
 */
export type Route =
  | { readonly page: 'menu' }
  | { readonly page: 'game'; readonly id: string }
  | { readonly page: 'stand' }
  | { readonly page: 'missing' }

const STAND = new Set(['test', 'admin'])

/** The page for a path under the site's base: '/', '/detective', '/test'. */
export function routeOf(pathname: string, base: string, games: readonly string[]): Route {
  const inside = pathname.startsWith(base) ? pathname.slice(base.length) : pathname
  const name = inside.replace(/^\/+|\/+$/g, '')
  if (name === '') return { page: 'menu' }
  if (STAND.has(name)) return { page: 'stand' }
  if (games.includes(name)) return { page: 'game', id: name }
  return { page: 'missing' }
}

/** The address of a page under the site's base. */
export function pathOf(route: Route, base: string): string {
  const root = base.endsWith('/') ? base : `${base}/`
  switch (route.page) {
    case 'menu':
    case 'missing':
      return root
    case 'game':
      return `${root}${route.id}`
    case 'stand':
      return `${root}test`
  }
}
