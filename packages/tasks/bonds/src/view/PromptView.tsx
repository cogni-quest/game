import type { Task } from '@cogni/core'

import { bondsPlugin, isBondsTask, type Room, type Token } from '../logic'

/** The textbook «домик», or a line like `13 = 10 + □`. */
export function PromptView({ task }: { readonly task: Task }) {
  if (!isBondsTask(task)) return null
  const { prompt } = task
  if (prompt.show === 'pairs') {
    return (
      <p className="bonds-line" aria-label={bondsPlugin.speak(task)}>
        <span>{prompt.whole}</span>
        <span>=</span>
        <span className="bonds-blank">? + ?</span>
      </p>
    )
  }
  if (prompt.show === 'line') {
    return (
      <p className="bonds-line" aria-label={bondsPlugin.speak(task)}>
        {prompt.tokens.map((token, i) => (
          <Cell key={i} token={token} />
        ))}
      </p>
    )
  }
  return (
    <div className="bonds-house" role="img" aria-label={bondsPlugin.speak(task)}>
      <div className="bonds-roof">{prompt.whole}</div>
      <div className="bonds-floor">
        {prompt.parts.map((room, i) => (
          <Cell key={i} token={room} />
        ))}
      </div>
    </div>
  )
}

const PLACE: Partial<Record<Token, string>> = { tens: 'дес.', hundreds: 'сот.' }

function Cell({ token }: { readonly token: Token | Room }) {
  if (token === 'blank') return <span className="bonds-blank">□</span>
  const place = PLACE[token]
  return place === undefined ? <span>{token}</span> : <small>{place}</small>
}
