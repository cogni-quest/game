import { createRegistry, type Task, type TaskView } from '@cogni/core'
import { additionPlugin } from '@cogni/task-addition/logic'
import { additionView } from '@cogni/task-addition/view'
import { comparingPlugin } from '@cogni/task-comparing/logic'
import { comparingView } from '@cogni/task-comparing/view'
import { countingPlugin } from '@cogni/task-counting/logic'
import { countingView } from '@cogni/task-counting/view'
import { neighboursPlugin } from '@cogni/task-neighbours/logic'
import { neighboursView } from '@cogni/task-neighbours/view'
import { lengthComparePlugin } from '@cogni/task-length-compare/logic'
import { lengthCompareView } from '@cogni/task-length-compare/view'
import { rulerPlugin } from '@cogni/task-ruler/logic'
import { rulerView } from '@cogni/task-ruler/view'
import { unitsPlugin } from '@cogni/task-units/logic'
import { unitsView } from '@cogni/task-units/view'
import { shapesPlugin } from '@cogni/task-shapes/logic'
import { shapesView } from '@cogni/task-shapes/view'
import { bondsPlugin } from '@cogni/task-bonds/logic'
import { bondsView } from '@cogni/task-bonds/view'
import { missingPlugin } from '@cogni/task-missing/logic'
import { missingView } from '@cogni/task-missing/view'
import { differencePlugin } from '@cogni/task-difference/logic'
import { differenceView } from '@cogni/task-difference/view'
import { measurePlugin } from '@cogni/task-measure/logic'
import { measureView } from '@cogni/task-measure/view'
import { numberLinePlugin } from '@cogni/task-number-line/logic'
import { numberLineView } from '@cogni/task-number-line/view'
import { wordPlugin } from '@cogni/task-word/logic'
import { wordView } from '@cogni/task-word/view'
import { moneyPlugin } from '@cogni/task-money/logic'
import { moneyView } from '@cogni/task-money/view'
import { clockPlugin } from '@cogni/task-clock/logic'
import { clockView } from '@cogni/task-clock/view'
import { chainPlugin } from '@cogni/task-chain/logic'
import { chainView } from '@cogni/task-chain/view'
import { expressionsPlugin } from '@cogni/task-expressions/logic'
import { expressionsView } from '@cogni/task-expressions/view'
import { perimeterPlugin } from '@cogni/task-perimeter/logic'
import { perimeterView } from '@cogni/task-perimeter/view'
import { anglesPlugin } from '@cogni/task-angles/logic'
import { anglesView } from '@cogni/task-angles/view'
import { areaPlugin } from '@cogni/task-area/logic'
import { areaView } from '@cogni/task-area/view'
import { timesPlugin } from '@cogni/task-times/logic'
import { timesView } from '@cogni/task-times/view'
import { remainderPlugin } from '@cogni/task-remainder/logic'
import { remainderView } from '@cogni/task-remainder/view'
import { groupsPlugin } from '@cogni/task-groups/logic'
import { groupsView } from '@cogni/task-groups/view'
import { calendarPlugin } from '@cogni/task-calendar/logic'
import { calendarView } from '@cogni/task-calendar/view'
import { romanPlugin } from '@cogni/task-roman/logic'
import { romanView } from '@cogni/task-roman/view'
import { columnPlugin } from '@cogni/task-column/logic'
import { columnView } from '@cogni/task-column/view'
import { sequencePlugin } from '@cogni/task-sequence/logic'
import { sequenceView } from '@cogni/task-sequence/view'
import { patternPlugin } from '@cogni/task-pattern/logic'
import { patternView } from '@cogni/task-pattern/view'
import { oddOneOutPlugin } from '@cogni/task-odd-one-out/logic'
import { oddOneOutView } from '@cogni/task-odd-one-out/view'
import { factsPlugin } from '@cogni/task-facts/logic'
import { factsView } from '@cogni/task-facts/view'
import { mazePlugin } from '@cogni/task-maze/logic'
import { mazeView } from '@cogni/task-maze/view'
import { sudokuPlugin } from '@cogni/task-sudoku/logic'
import { sudokuView } from '@cogni/task-sudoku/view'
import { olympiadPlugin } from '@cogni/task-olympiad/logic'
import { olympiadView } from '@cogni/task-olympiad/view'
import { sortPlugin } from '@cogni/task-sort/logic'
import { sortView } from '@cogni/task-sort/view'
import type { ReactNode } from 'react'

/**
 * Every task plugin the game knows, logic and view together. Adding a plugin
 * is one line here; nothing else in the app names a plugin.
 */
const PLUGINS = [
  { logic: additionPlugin, view: additionView },
  { logic: countingPlugin, view: countingView },
  { logic: comparingPlugin, view: comparingView },
  { logic: neighboursPlugin, view: neighboursView },
  { logic: lengthComparePlugin, view: lengthCompareView },
  { logic: rulerPlugin, view: rulerView },
  { logic: unitsPlugin, view: unitsView },
  { logic: shapesPlugin, view: shapesView },
  { logic: bondsPlugin, view: bondsView },
  { logic: missingPlugin, view: missingView },
  { logic: differencePlugin, view: differenceView },
  { logic: measurePlugin, view: measureView },
  { logic: numberLinePlugin, view: numberLineView },
  { logic: wordPlugin, view: wordView },
  { logic: moneyPlugin, view: moneyView },
  { logic: clockPlugin, view: clockView },
  { logic: chainPlugin, view: chainView },
  { logic: expressionsPlugin, view: expressionsView },
  { logic: perimeterPlugin, view: perimeterView },
  { logic: anglesPlugin, view: anglesView },
  { logic: areaPlugin, view: areaView },
  { logic: timesPlugin, view: timesView },
  { logic: remainderPlugin, view: remainderView },
  { logic: groupsPlugin, view: groupsView },
  { logic: calendarPlugin, view: calendarView },
  { logic: romanPlugin, view: romanView },
  { logic: columnPlugin, view: columnView },
  { logic: sequencePlugin, view: sequenceView },
  { logic: patternPlugin, view: patternView },
  { logic: oddOneOutPlugin, view: oddOneOutView },
  { logic: factsPlugin, view: factsView },
  { logic: mazePlugin, view: mazeView },
  { logic: sudokuPlugin, view: sudokuView },
  { logic: olympiadPlugin, view: olympiadView },
  { logic: sortPlugin, view: sortView },
] as const

export const registry = createRegistry(PLUGINS.map((p) => p.logic))

const views = new Map<string, TaskView<ReactNode>>(PLUGINS.map((p) => [p.view.pluginId, p.view]))

export function renderPrompt(task: Task): ReactNode {
  const view = views.get(task.pluginId)
  if (!view) throw new Error(`No view for tasks of plugin '${task.pluginId}'`)
  return view.renderPrompt(task)
}
