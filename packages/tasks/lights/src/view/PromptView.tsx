import { counted, type Task } from '@cogni/core'

import { isLightsTask } from '../logic'

/**
 * What is asked, before the panel: how many lights, which way to press them
 * back, and whether their colours count. The lights themselves flash on the
 * panel, in the answer form.
 */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isLightsTask(task)) return null
  const { shown, order, colours } = task.prompt
  const forward = order === 'forward'
  const title = forward ? 'Повтори огоньки' : 'Повтори наоборот'
  const rule = [
    counted(shown.length, ['огонёк', 'огонька', 'огоньков']),
    forward ? 'в том же порядке' : 'с последнего до первого',
    ...(colours === undefined ? [] : [counted(colours.length, ['цвет', 'цвета', 'цветов'])]),
  ]
  return (
    <figure className="lights-prompt">
      <figcaption>{colours === undefined ? title : `${title} и цвета`}</figcaption>
      <p className={`lights-rule ${order}`}>{rule.join(' · ')}</p>
    </figure>
  )
}
