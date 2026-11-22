import { NAMES, type Segment } from '../logic'
import { PICTURE } from './pictures'

/** Words with the landmarks drawn as their pictures, named for a screen reader. */
export function Words({ segments }: { readonly segments: readonly Segment[] }) {
  return (
    <>
      {segments.map((segment, i) =>
        'text' in segment ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <span
            key={i}
            className={`spy-landmark landmark-${segment.landmark}`}
            role="img"
            aria-label={NAMES[segment.landmark][segment.form]}
          >
            {PICTURE[segment.landmark]}
          </span>
        ),
      )}
    </>
  )
}
