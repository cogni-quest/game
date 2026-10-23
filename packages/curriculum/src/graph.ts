import type { Step } from '@cogni/core'
import { z } from 'zod'

/** One «приём» of the topic: a setting of the plugin's knobs. */
const section = z.strictObject({
  /** A name for people: «±1», «□ + 2». */
  title: z.string().min(1).optional(),
  /** Where it comes from when it is not the graph's own textbook: «петерсон». */
  source: z.string().min(1).optional(),
  knobs: z.unknown(),
})

const formatFields = {
  plugin: z.string().min(1),
  /** A name for people: «сложение», «бар-модель». */
  title: z.string().min(1).optional(),
  /** ★ — non-standard, ★★ — olympiad: only the boss asks these. */
  stars: z.union([z.literal(1), z.literal(2)]).optional(),
}

/**
 * A format lists the topic's sections in the textbook's order — the core makes
 * the five levels out of them. A format with one section can be written with
 * just `knobs`.
 */
const format = z
  .union([
    z.strictObject({ ...formatFields, knobs: z.unknown() }),
    z.strictObject({ ...formatFields, sections: z.array(section).min(1) }),
  ])
  .transform(({ plugin, title, stars, ...rest }) => ({
    plugin,
    ...(title === undefined ? {} : { title }),
    ...(stars === undefined ? {} : { stars }),
    sections: 'sections' in rest ? rest.sections : [{ knobs: rest.knobs }],
  }))

const step = z
  .strictObject({
    id: z.string().min(1),
    title: z.string().min(1),
    /** Tries a task of this step gets, when the default does not suit it. */
    attempts: z.int().min(1).optional(),
    formats: z.array(format).min(1),
  })
  .transform(({ attempts, ...rest }) => ({
    ...rest,
    ...(attempts === undefined ? {} : { attempts }),
  }))

const topic = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  /**
   * The school year it belongs to; a topic never spans two. Left out for a
   * branch that runs alongside the years, like logic.
   */
  grade: z.int().min(1).max(4).optional(),
  /** Topics that must be mastered before this one opens. */
  needs: z.array(z.string()),
  /** In order: the first step is introduced first. */
  steps: z.array(step).min(1),
})

const graph = z.strictObject({
  subject: z.string().min(1),
  textbook: z.string().min(1),
  topics: z.array(topic).min(1),
})

export type CurriculumSection = z.infer<typeof section>
export type CurriculumFormat = z.infer<typeof format>
export type CurriculumStep = z.infer<typeof step> & Step
export type Topic = z.infer<typeof topic>
export type Graph = z.infer<typeof graph>

/**
 * Validates a graph that arrives as data, and the things a schema cannot say:
 * ids are unique, every `needs` names a topic that exists, and nothing needs
 * itself, directly or round a loop.
 */
export function parseGraph(raw: unknown): Graph {
  const parsed = graph.parse(raw)

  const topicIds = new Set<string>()
  const stepIds = new Set<string>()
  for (const t of parsed.topics) {
    if (topicIds.has(t.id)) throw new Error(`Topic '${t.id}' appears twice`)
    topicIds.add(t.id)
    for (const s of t.steps) {
      if (stepIds.has(s.id)) throw new Error(`Step '${s.id}' appears twice`)
      stepIds.add(s.id)
    }
  }

  for (const t of parsed.topics) {
    for (const need of t.needs) {
      if (!topicIds.has(need)) throw new Error(`Topic '${t.id}' needs '${need}', which is not here`)
    }
  }

  assertNoCycles(parsed.topics)
  return parsed
}

function assertNoCycles(topics: readonly Topic[]): void {
  const needs = new Map(topics.map((t) => [t.id, t.needs]))
  const done = new Set<string>()
  const visiting = new Set<string>()

  const visit = (id: string, path: readonly string[]): void => {
    if (done.has(id)) return
    if (visiting.has(id)) {
      throw new Error(`Topics need each other in a loop: ${[...path, id].join(' → ')}`)
    }
    visiting.add(id)
    for (const need of needs.get(id) ?? []) visit(need, [...path, id])
    visiting.delete(id)
    done.add(id)
  }

  for (const t of topics) visit(t.id, [])
}

/** Every step of the graph, topic by topic, in order. */
export function allSteps(g: Graph): readonly CurriculumStep[] {
  return g.topics.flatMap((t) => t.steps)
}
