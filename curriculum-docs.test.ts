import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { attention, logicPeterson, mathMoro } from '@cogni/curriculum'
import { describe, expect, it } from 'vitest'

/**
 * The curriculum graph in docs/CURRICULUM.md is the source of truth; the data
 * the game runs on must match it, and a change goes to the document first.
 * This keeps the two from drifting apart.
 */
const ROOT = dirname(fileURLToPath(import.meta.url))
const doc = readFileSync(join(ROOT, 'docs/CURRICULUM.md'), 'utf8')

/** Topics as the document lists them: «#### 5. add-sub-10 «…» · 1 класс — ✅ сделано». */
const docTopics = [...doc.matchAll(/^#### (\d+)\. ([a-z0-9-]+) «[^»]*» · (\d) класс(.*)$/gm)].map(
  (m) => ({
    number: Number(m[1]),
    id: m[2] ?? '',
    grade: Number(m[3]),
    done: (m[4] ?? '').includes('✅ сделано'),
  }),
)

/** The edges of the math graph's diagram: «a_b --> c_d --> e» chains, ids back to «a-b». */
function docEdges(): readonly (readonly [string, string])[] {
  const start = doc.indexOf('## Граф математики')
  const block = /```mermaid\n([\s\S]*?)```/.exec(doc.slice(start))?.[1] ?? ''
  return block
    .split('\n')
    .filter((line) => line.includes('-->'))
    .flatMap((line) => {
      const ids = line.split('-->').map((part) => part.trim().replaceAll('_', '-'))
      return ids.slice(1).map((to, i) => [ids[i] ?? '', to] as const)
    })
}

describe('the math graph diagram', () => {
  const number = new Map(docTopics.map((t) => [t.id, t.number]))
  const edges = docEdges()

  it('connects only topics the document lists', () => {
    expect(edges.length).toBeGreaterThan(0)
    expect(edges.flat().filter((id) => !number.has(id))).toEqual([])
  })

  it('never makes a topic need one that comes later in the textbook', () => {
    const backwards = edges
      .filter(([from, to]) => (number.get(from) ?? 0) >= (number.get(to) ?? 0))
      .map(([from, to]) => `${from} → ${to}`)
    expect(backwards).toEqual([])
  })

  it('backs every «needs» of the data with a path in the diagram', () => {
    const next = new Map<string, string[]>()
    for (const [from, to] of edges) next.set(from, [...(next.get(from) ?? []), to])
    const reaches = (from: string, to: string): boolean => {
      const seen = new Set<string>()
      const queue = [from]
      while (queue.length > 0) {
        const id = queue.shift() ?? ''
        if (id === to) return true
        if (seen.has(id)) continue
        seen.add(id)
        queue.push(...(next.get(id) ?? []))
      }
      return false
    }
    const unbacked = mathMoro.topics.flatMap((t) =>
      t.needs.filter((need) => !reaches(need, t.id)).map((need) => `${need} → ${t.id}`),
    )
    expect(unbacked).toEqual([])
  })
})

describe('docs/CURRICULUM.md and the graph data', () => {
  it('lists its topics numbered 1, 2, 3 … with unique ids', () => {
    expect(docTopics.length).toBeGreaterThan(0)
    expect(docTopics.map((t) => t.number)).toEqual(docTopics.map((_, i) => i + 1))
    expect(new Set(docTopics.map((t) => t.id)).size).toBe(docTopics.length)
  })

  it('never lets a later topic belong to an earlier grade', () => {
    const grades = docTopics.map((t) => t.grade)
    expect(grades).toEqual([...grades].sort((a, b) => a - b))
  })

  it('has every topic of the data, in the same grade', () => {
    const byId = new Map(docTopics.map((t) => [t.id, t]))
    const mismatched = mathMoro.topics
      .filter((t) => byId.get(t.id)?.grade !== t.grade)
      .map((t) => `${t.id} (grade ${String(t.grade)})`)
    expect(mismatched).toEqual([])
  })

  it('keeps the data topics in the order of the document', () => {
    const position = new Map(docTopics.map((t) => [t.id, t.number]))
    const numbers = mathMoro.topics.map((t) => position.get(t.id) ?? 0)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })

  it('marks as done exactly the topics the data has', () => {
    const done = docTopics.filter((t) => t.done).map((t) => t.id)
    expect(done.sort()).toEqual(mathMoro.topics.map((t) => t.id).sort())
  })

  it('ticks «Есть» on exactly the formats the data has', () => {
    const ticked = new Map(docTopics.map((t) => [t.id, tickedFormats(t.id)]))
    const inData = new Map(
      mathMoro.topics.map((t) => [
        t.id,
        t.steps.flatMap((s) => s.formats.map((f) => f.title ?? f.plugin)).sort(),
      ]),
    )
    const mismatched = docTopics
      .filter((t) => JSON.stringify(ticked.get(t.id)) !== JSON.stringify(inData.get(t.id) ?? []))
      .map(
        (t) =>
          `${t.id}: doc ${JSON.stringify(ticked.get(t.id))}, data ${JSON.stringify(inData.get(t.id) ?? [])}`,
      )
    expect(mismatched).toEqual([])
  })
})

/** The formats of a topic's table whose «Есть» column is ✅, by name. */
function tickedFormats(id: string): string[] {
  const lines = doc.split('\n')
  const start = lines.findIndex((l) => l.startsWith('#### ') && l.includes(` ${id} «`))
  const rows: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.startsWith('#### ') || line.startsWith('## ')) break
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length > 5 && cells[4] === '✅') rows.push(cells[1] ?? '')
  }
  return rows.sort()
}

describe('the logic branch of docs/CURRICULUM.md and its data', () => {
  const branch = doc.slice(doc.indexOf('## Ветка логики'), doc.indexOf('## Память и внимание'))
  const ids = [...branch.matchAll(/^#### ([a-z-]+) «/gm)].map((m) => m[1] ?? '')

  it('lists the topics of the data, in the same order, all marked done', () => {
    expect(ids).toEqual(logicPeterson.topics.map((t) => t.id))
    const done = [...branch.matchAll(/^#### ([a-z-]+) «.*✅ сделано/gm)].map((m) => m[1])
    expect(done).toEqual(ids)
  })

  it('ticks «Есть» on exactly the formats the data has', () => {
    const mismatched = logicPeterson.topics
      .filter((t) => {
        const inData = t.steps.flatMap((s) => s.formats.map((f) => f.title ?? f.plugin)).sort()
        return JSON.stringify(tickedFormats(t.id)) !== JSON.stringify(inData)
      })
      .map((t) => t.id)
    expect(mismatched).toEqual([])
  })

  it('backs every «needs» of the data with an edge of its diagram', () => {
    const block = /```mermaid\n([\s\S]*?)```/.exec(branch)?.[1] ?? ''
    const edges = new Set(
      block
        .split('\n')
        .filter((line) => line.includes('-->'))
        .map((line) =>
          line
            .split('-->')
            .map((part) =>
              part
                .replace(/\[.*\]/, '')
                .trim()
                .replaceAll('_', '-'),
            )
            .join('→'),
        ),
    )
    const unbacked = logicPeterson.topics.flatMap((t) =>
      t.needs.filter((need) => !edges.has(`${need}→${t.id}`)).map((need) => `${need} → ${t.id}`),
    )
    expect(unbacked).toEqual([])
  })
})

describe('the memory and attention section of docs/CURRICULUM.md and its data', () => {
  const section = doc.slice(doc.indexOf('## Память и внимание'), doc.indexOf('## Сверить'))
  const ids = [...section.matchAll(/^#### ([a-z-]+) «/gm)].map((m) => m[1] ?? '')

  it('lists the topics of the data, in the same order, all marked done', () => {
    expect(ids).toEqual(attention.topics.map((t) => t.id))
    const done = [...section.matchAll(/^#### ([a-z-]+) «.*✅ сделано/gm)].map((m) => m[1])
    expect(done).toEqual(ids)
  })

  it('ticks «Есть» on exactly the formats the data has', () => {
    const mismatched = attention.topics
      .filter((t) => {
        const inData = t.steps.flatMap((s) => s.formats.map((f) => f.title ?? f.plugin)).sort()
        return JSON.stringify(tickedFormats(t.id)) !== JSON.stringify(inData)
      })
      .map((t) => t.id)
    expect(mismatched).toEqual([])
  })
})
