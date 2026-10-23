import { parseGraph, type Graph } from './graph'
import logicPetersonRaw from './logic-peterson.json'
import mathMoroRaw from './math-moro.json'

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
