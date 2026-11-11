import attentionRaw from './attention.json'
import { parseGraph, type Graph } from './graph'
import logicPetersonRaw from './logic-peterson.json'
import mathMoroRaw from './math-moro.json'
import memoryRaw from './memory.json'

export {
  allSteps,
  parseGraph,
  type CurriculumFormat,
  type CurriculumSection,
  type CurriculumStep,
  type Graph,
  type Topic,
} from './graph'

/** Arithmetic in the order of Моро («Школа России»). */
export const mathMoro: Graph = parseGraph(mathMoroRaw)

/** The logic branch, after Петерсон and «Кенгуру»: alongside the school years, no grades. */
export const logicPeterson: Graph = parseGraph(logicPetersonRaw)

/** Attention — our own, after no textbook: the grid dictation first. */
export const attention: Graph = parseGraph(attentionRaw)

/**
 * Working memory — our own too, a subject apart from attention so that each
 * game asks only its own kind: the robots' lights are never a detective's case.
 */
export const memory: Graph = parseGraph(memoryRaw)

/** A subject and its graph, with the name people see for it. */
export interface Subject {
  /** The graph's own `subject`, never typed twice. */
  readonly id: string
  readonly label: string
  readonly graph: Graph
}

const subject = (label: string, graph: Graph): Subject => ({ id: graph.subject, label, graph })

/**
 * Every subject, in the order the stand lists them. A new subject is one line
 * here: the host, the stand and the graph tests all go round this list.
 */
export const SUBJECTS: readonly Subject[] = [
  subject('Математика', mathMoro),
  subject('Логика', logicPeterson),
  subject('Внимание', attention),
  subject('Память', memory),
]
