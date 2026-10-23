import { createRandom, createRegistry } from '@cogni/core'
import { additionPlugin } from '@cogni/task-addition/logic'
import { comparingPlugin } from '@cogni/task-comparing/logic'
import { countingPlugin } from '@cogni/task-counting/logic'
import { neighboursPlugin } from '@cogni/task-neighbours/logic'
import { lengthComparePlugin } from '@cogni/task-length-compare/logic'
import { rulerPlugin } from '@cogni/task-ruler/logic'
import { unitsPlugin } from '@cogni/task-units/logic'
import { shapesPlugin } from '@cogni/task-shapes/logic'
import { bondsPlugin } from '@cogni/task-bonds/logic'
import { missingPlugin } from '@cogni/task-missing/logic'
import { differencePlugin } from '@cogni/task-difference/logic'
import { measurePlugin } from '@cogni/task-measure/logic'
import { numberLinePlugin } from '@cogni/task-number-line/logic'
import { wordPlugin } from '@cogni/task-word/logic'
import { moneyPlugin } from '@cogni/task-money/logic'
import { clockPlugin } from '@cogni/task-clock/logic'
import { chainPlugin } from '@cogni/task-chain/logic'
import { expressionsPlugin } from '@cogni/task-expressions/logic'
import { perimeterPlugin } from '@cogni/task-perimeter/logic'
import { anglesPlugin } from '@cogni/task-angles/logic'
import { areaPlugin } from '@cogni/task-area/logic'
import { timesPlugin } from '@cogni/task-times/logic'
import { remainderPlugin } from '@cogni/task-remainder/logic'
import { groupsPlugin } from '@cogni/task-groups/logic'
import { calendarPlugin } from '@cogni/task-calendar/logic'
import { romanPlugin } from '@cogni/task-roman/logic'
import { columnPlugin } from '@cogni/task-column/logic'
import { sequencePlugin } from '@cogni/task-sequence/logic'
import { patternPlugin } from '@cogni/task-pattern/logic'
import { oddOneOutPlugin } from '@cogni/task-odd-one-out/logic'
import { factsPlugin } from '@cogni/task-facts/logic'
import { mazePlugin } from '@cogni/task-maze/logic'
import { sudokuPlugin } from '@cogni/task-sudoku/logic'
import { olympiadPlugin } from '@cogni/task-olympiad/logic'
import { sortPlugin } from '@cogni/task-sort/logic'
import { dictationPlugin } from '@cogni/task-dictation/logic'
import { describe, expect, it } from 'vitest'

import { allSteps, parseGraph, type CurriculumStep } from './graph'
import { attention, logicPeterson, mathMoro } from './index'

const registry = createRegistry([
  additionPlugin,
  countingPlugin,
  comparingPlugin,
  neighboursPlugin,
  lengthComparePlugin,
  rulerPlugin,
  unitsPlugin,
  shapesPlugin,
  bondsPlugin,
  missingPlugin,
  differencePlugin,
  measurePlugin,
  numberLinePlugin,
  wordPlugin,
  moneyPlugin,
  clockPlugin,
  chainPlugin,
  expressionsPlugin,
  perimeterPlugin,
  anglesPlugin,
  areaPlugin,
  timesPlugin,
  remainderPlugin,
  groupsPlugin,
  calendarPlugin,
  romanPlugin,
  columnPlugin,
  sequencePlugin,
  patternPlugin,
  oddOneOutPlugin,
  factsPlugin,
  mazePlugin,
  sudokuPlugin,
  olympiadPlugin,
  sortPlugin,
  dictationPlugin,
])
const SAMPLES = 3_000
/** Sampling every section of every topic takes seconds, more under a parallel run. */
const SLOW = 60_000

/** Every section of every format of a step. */
function variants(step: CurriculumStep) {
  return step.formats.flatMap((format, f) =>
    format.sections.map((section, s) => ({
      format,
      index: s,
      label: `${step.id} format ${String(f + 1)} section ${String(s + 1)} (${section.title ?? '—'})`,
    })),
  )
}

/** The examples a step asks across all its sections, sampled once. */
const keysCache = new Map<string, ReadonlySet<string>>()
function keysOf(step: CurriculumStep): ReadonlySet<string> {
  let keys = keysCache.get(step.id)
  if (!keys) {
    const random = createRandom(11)
    keys = new Set(
      variants(step).flatMap(({ format, index }) =>
        Array.from(
          { length: SAMPLES },
          () => registry.generateSection(format, index, random).itemKey,
        ),
      ),
    )
    keysCache.set(step.id, keys)
  }
  return keys
}

/**
 * Every graph, each on its own. Only arithmetic needs a number format in every
 * step: in logic a pattern or a maze is answered by choosing, and that is the
 * task, not a way round it (CURRICULUM.md, «Ветка логики»); a dictation is
 * answered by pointing at a cell, and there are dozens to choose from.
 */
describe.each([
  ['math-moro', mathMoro, true],
  ['logic-peterson', logicPeterson, false],
  ['attention', attention, false],
] as const)('%s', (_name, graph, numberRule) => {
  const steps = allSteps(graph)

  it.each(steps.flatMap(variants).map((v) => [v.label, v] as const))(
    '%s generates tasks',
    (_label, { format, index }) => {
      const random = createRandom(5)
      const keys = new Set(
        Array.from({ length: 200 }, () => registry.generateSection(format, index, random).itemKey),
      )
      expect(keys.size).toBeGreaterThan(0)
    },
  )

  it.runIf(numberRule)(
    'gives every step a format answered with a number, so guessing cannot pass it',
    () => {
      const random = createRandom(3)
      const withoutNumber = steps
        .filter(
          (step) =>
            !step.formats.some(
              (format) =>
                format.stars === undefined &&
                registry.generateLevel(format, 1, random).answer.shape === 'number',
            ),
        )
        .map((step) => step.id)
      expect(withoutNumber).toEqual([])
    },
  )

  it(
    'never lets a step ask what a step before it already asks',
    () => {
      const seenBefore = new Map<string, string>()
      const repeats: string[] = []
      for (const step of steps) {
        for (const key of keysOf(step)) {
          const earlier = seenBefore.get(key)
          if (earlier !== undefined) repeats.push(`${step.id} asks ${key}, as ${earlier} does`)
        }
        for (const key of keysOf(step)) seenBefore.set(key, step.id)
      }
      expect(repeats).toEqual([])
    },
    SLOW,
  )
})

describe('parseGraph', () => {
  const graph = (topics: unknown[]) => ({ subject: 'math', textbook: 'test', topics })
  const topic = (id: string, needs: string[], stepId = id) => ({
    id,
    title: id,
    grade: 1,
    needs,
    steps: [{ id: stepId, title: stepId, formats: [{ plugin: 'addition', knobs: {} }] }],
  })

  it('accepts a well-formed graph', () => {
    expect(parseGraph(graph([topic('A', []), topic('B', ['A'])])).topics).toHaveLength(2)
  })

  it('refuses a need that names no topic', () => {
    expect(() => parseGraph(graph([topic('A', ['Z'])]))).toThrow(/'Z'/)
  })

  it('refuses topics that need each other in a loop', () => {
    expect(() => parseGraph(graph([topic('A', ['B']), topic('B', ['A'])]))).toThrow(/loop/)
  })

  it('refuses duplicate topic and step ids', () => {
    expect(() => parseGraph(graph([topic('A', []), topic('A', [])]))).toThrow(/'A'/)
    expect(() => parseGraph(graph([topic('A', [], 'S'), topic('B', [], 'S')]))).toThrow(/'S'/)
  })

  it('refuses unknown fields', () => {
    expect(() => parseGraph({ ...graph([topic('A', [])]), extra: 1 })).toThrow()
  })

  const withFormat = (format: unknown) =>
    graph([
      {
        id: 'A',
        title: 'A',
        grade: 1,
        needs: [],
        steps: [{ id: 'A', title: 'A', formats: [format] }],
      },
    ])

  it('turns knobs into a single section and keeps sections as given', () => {
    const one = parseGraph(withFormat({ plugin: 'p', knobs: { x: 1 } }))
    expect(one.topics[0]?.steps[0]?.formats[0]?.sections).toEqual([{ knobs: { x: 1 } }])
    const sections = [
      { title: 'a', knobs: 1 },
      { title: 'b', source: 'петерсон', knobs: 2 },
    ]
    const two = parseGraph(withFormat({ plugin: 'p', title: 't', sections }))
    expect(two.topics[0]?.steps[0]?.formats[0]).toEqual({ plugin: 'p', title: 't', sections })
  })

  it('refuses a format with no sections, or with both knobs and sections', () => {
    expect(() => parseGraph(withFormat({ plugin: 'p', sections: [] }))).toThrow()
    expect(() =>
      parseGraph(withFormat({ plugin: 'p', knobs: 1, sections: [{ knobs: 1 }] })),
    ).toThrow()
  })
})
