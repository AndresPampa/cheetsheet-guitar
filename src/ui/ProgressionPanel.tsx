import { useEffect, useId, useRef } from 'react'
import { displayRoman, useMessages } from '../i18n/index.ts'
import type { ChordQuality, KeyMode } from '../theory/index.ts'
import './ProgressionPanel.css'

interface Step {
  roman: string
  symbol: string
  quality: ChordQuality
  tonic: string
  mode: KeyMode
}

// Consecutive steps in the same key (same spelling, same mode) form a block; indexes stay global.
const toBlocks = (steps: Step[]) =>
  steps.reduce<Array<{ tonic: string; mode: KeyMode; steps: Array<Step & { index: number }> }>>(
    (blocks, step, index) => {
      const last = blocks.at(-1)
      if (last?.tonic === step.tonic && last.mode === step.mode) last.steps.push({ ...step, index })
      else blocks.push({ tonic: step.tonic, mode: step.mode, steps: [{ ...step, index }] })
      return blocks
    },
    [],
  )

interface ProgressionPanelProps {
  /** Each step already resolved in its own key; `symbol` and `tonic` in theory spelling. */
  steps: Step[]
  /** Last add or remove, for screen readers (`''` until the first); `id` changes on each one. */
  announcement: { text: string; id: number }
  onOpen: (index: number) => void
  onRemove: (index: number) => void
}

export function ProgressionPanel({ steps, announcement, onOpen, onRemove }: ProgressionPanelProps) {
  const t = useMessages()
  const blocksRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Index of the removed step, until the list re-renders without it.
  const removed = useRef<number | null>(null)

  // Focus goes to the ✕ now in the removed step's place, else the one before, else the heading.
  useEffect(() => {
    if (removed.current === null) return
    const removes = blocksRef.current?.querySelectorAll<HTMLButtonElement>('.progression-remove')
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
        <div ref={blocksRef} className="progression-blocks">
          {toBlocks(steps).map((block, position) => (
            // The label shows even with one block: the circle may be in another key.
            <div
              key={position}
              role="group"
              aria-labelledby={`${labelId}-${position}`}
              className="progression-block"
            >
              <p id={`${labelId}-${position}`} className="progression-key">
                {t.symbol(block.tonic)} {t.keyMode[block.mode]}
              </p>
              <ol className="progression-steps">
                {block.steps.map(({ roman, symbol, quality, index }) => {
                  const shown = t.symbol(symbol)
                  return (
                    // Steps have no identity of their own: the same chord may repeat.
                    // Colored like the chips (CircleOfFifths.css); roman and symbol also say the quality.
                    <li key={index} className={`chord--${quality}`}>
                      <button
                        type="button"
                        className="progression-step"
                        onClick={() => onOpen(index)}
                      >
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
            </div>
          ))}
        </div>
      )}
      <div className="sr-only" aria-live="polite">
        <span key={announcement.id}>{announcement.text}</span>
      </div>
    </div>
  )
}
