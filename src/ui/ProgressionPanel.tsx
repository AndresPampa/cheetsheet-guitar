import { useEffect, useRef } from 'react'
import { displayRoman, useMessages } from '../i18n/index.ts'
import type { ChordQuality } from '../theory/index.ts'
import './ProgressionPanel.css'

interface ProgressionPanelProps {
  /** Each step already resolved in the current key; `symbol` in theory spelling. */
  steps: Array<{ roman: string; symbol: string; quality: ChordQuality }>
  /** Last add or remove, for screen readers (`''` until the first); `id` changes on each one. */
  announcement: { text: string; id: number }
  onOpen: (index: number) => void
  onRemove: (index: number) => void
}

export function ProgressionPanel({ steps, announcement, onOpen, onRemove }: ProgressionPanelProps) {
  const t = useMessages()
  const listRef = useRef<HTMLOListElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Index of the removed step, until the list re-renders without it.
  const removed = useRef<number | null>(null)

  // Focus goes to the ✕ now in the removed step's place, else the one before, else the heading.
  useEffect(() => {
    if (removed.current === null) return
    const removes = listRef.current?.querySelectorAll<HTMLButtonElement>('.progression-remove')
    const next = removes?.[Math.min(removed.current, removes.length - 1)]
    removed.current = null
    ;(next ?? headingRef.current)?.focus()
  })

  return (
    <div className="progression-panel">
      <h2 ref={headingRef} tabIndex={-1}>
        {t.progressionRegion}
      </h2>
      {steps.length === 0 ? (
        <p className="progression-empty">{t.progressionEmpty}</p>
      ) : (
        <ol ref={listRef} className="progression-steps">
          {steps.map(({ roman, symbol, quality }, index) => {
            const shown = t.symbol(symbol)
            return (
              // Steps have no identity of their own: the same chord may repeat.
              // Colored like the chips (CircleOfFifths.css); roman and symbol also say the quality.
              <li key={index} className={`chord--${quality}`}>
                <button type="button" className="progression-step" onClick={() => onOpen(index)}>
                  <span className="progression-roman">{displayRoman(roman)}</span> {shown}
                  <span className="sr-only">{t.stepNumber(index + 1)}</span>
                </button>
                <button
                  type="button"
                  className="progression-remove"
                  aria-label={t.removeStep(shown, index + 1)}
                  onClick={() => {
                    removed.current = index
                    onRemove(index)
                  }}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ol>
      )}
      <div className="sr-only" aria-live="polite">
        <span key={announcement.id}>{announcement.text}</span>
      </div>
    </div>
  )
}
