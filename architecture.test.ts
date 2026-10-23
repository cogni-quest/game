import { globSync, readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Who may import what (ARCHITECTURE.md, «Три слоя»): dependencies point only
 * down, the methodology knows nothing of React or the cloud, and a task plugin
 * never reaches into another one.
 *
 * Each zone lists the packages it may import; relative imports must stay
 * inside `reach`. tsconfig.pure.json guards the other half — DOM globals — so
 * between them both ways out are closed.
 */
interface Zone {
  readonly name: string
  /** The zone's directory, relative to the repo root; `*` is one path segment. */
  readonly root: string
  /**
   * Where relative imports may land; defaults to `root`. A `*` here stands for
   * the same segment as in the importing file's path, so one plugin cannot
   * reach into another.
   */
  readonly reach?: string
  /** Packages it may import; a trailing `*` matches any name with that prefix. */
  readonly allowed: readonly string[]
  /** Extra packages its tests may import. */
  readonly allowedInTests?: readonly string[]
}

const ZONES: readonly Zone[] = [
  { name: 'core', root: 'packages/core/src', allowed: [] },
  {
    name: 'task plugin logic',
    root: 'packages/tasks/*/src/logic',
    allowed: ['@cogni/core', 'zod'],
  },
  {
    name: 'task plugin view',
    root: 'packages/tasks/*/src/view',
    // The view half of a plugin may use its own logic half.
    reach: 'packages/tasks/*/src',
    allowed: ['@cogni/core', 'react'],
  },
  {
    name: 'curriculum',
    root: 'packages/curriculum/src',
    allowed: ['@cogni/core', 'zod'],
    allowedInTests: ['@cogni/task-*'],
  },
]

const ALWAYS_IN_TESTS = ['vitest']

const ROOT = dirname(fileURLToPath(import.meta.url))

function filesOf(zone: Zone): string[] {
  return globSync(`${zone.root}/**/*.{ts,tsx}`, { cwd: ROOT }).map((f) => f.replaceAll('\\', '/'))
}

function importsOf(file: string): string[] {
  return ts
    .preProcessFile(readFileSync(join(ROOT, file), 'utf8'), true, true)
    .importedFiles.map((f) => f.fileName)
}

/** Fills each `*` of a pattern with the file's own segment: the plugin it belongs to. */
function concrete(pattern: string, file: string): string {
  const fileSegments = file.split('/')
  return pattern
    .split('/')
    .map((segment, i) => (segment === '*' ? (fileSegments[i] ?? segment) : segment))
    .join('/')
}

function packageAllowed(specifier: string, allowed: readonly string[]): boolean {
  return allowed.some((a) =>
    a.endsWith('*')
      ? specifier.startsWith(a.slice(0, -1))
      : specifier === a || specifier.startsWith(`${a}/`),
  )
}

function violations(zone: Zone, files: readonly string[]): string[] {
  const found: string[] = []
  for (const file of files) {
    const allowed = /\.test\.tsx?$/.test(file)
      ? [...zone.allowed, ...ALWAYS_IN_TESTS, ...(zone.allowedInTests ?? [])]
      : zone.allowed
    const reach = concrete(zone.reach ?? zone.root, file)
    for (const specifier of importsOf(file)) {
      if (specifier.startsWith('.')) {
        const target = posix.join(posix.dirname(file), specifier)
        if (!`${target}/`.startsWith(`${reach}/`)) {
          found.push(`${file} reaches outside ${reach}: ${specifier}`)
        }
      } else if (!packageAllowed(specifier, allowed)) {
        found.push(`${file} may not import ${specifier}`)
      }
    }
  }
  return found
}

describe('architecture', () => {
  it.each(ZONES.map((zone) => [zone.name, zone, filesOf(zone)] as const))(
    '%s imports only what it is allowed to',
    (name, zone, files) => {
      expect(files.length, `${name} has no files — is the root right?`).toBeGreaterThan(0)
      expect(violations(zone, files)).toEqual([])
    },
  )
})
