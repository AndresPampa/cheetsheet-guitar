import { useEffect, useId, useRef, useState } from 'react'
import { displayRoman, useMessages } from '../i18n/index.ts'
import { MAX_BPM, MAX_STEPS, MIN_BPM } from '../state/index.ts'
import {
  SUGGESTED_PROGRESSIONS,
  type ChordQuality,
  type KeyMode,
  type SuggestionId,
} from '../theory/index.ts'
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
  /** Last edit, for screen readers (`''` until the first); `id` changes on each one. */
  announcement: { text: string; id: number }
  onOpen: (index: number) => void
  onRemove: (index: number) => void
  /** Swaps the step at `index` with its neighbor at `to`. */
  onMove: (index: number, to: number) => void
  onClear: () => void
  /** Appends a suggested progression; only called when it fits in the 32 steps. */
  onAddSuggestion: (id: SuggestionId) => void
  /** Index of the step sounding, `null` when stopped. */
  playing: number | null
  onPlay: () => void
  onStop: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  loop: boolean
  onLoopChange: (loop: boolean) => void
}

export function ProgressionPanel({
  steps,
  announcement,
  onOpen,
  onRemove,
  onMove,
  onClear,
  onAddSuggestion,
  playing,
  onPlay,
  onStop,
  bpm,
  onBpmChange,
  loop,
  onLoopChange,
}: ProgressionPanelProps) {
  const t = useMessages()
  const blocksRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const bpmId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirming, setConfirming] = useState(false)
  // Emptied another way (✕): close the question, or the next add would bring it back unasked.
  if (confirming && steps.length === 0) setConfirming(false)
  // Set by an edit, run once the list re-renders: picks the element that gets the focus.
  const focusAfter = useRef<(() => HTMLElement | null | undefined) | null>(null)
  const suggestionId = useId()
  const [suggestion, setSuggestion] = useState<SuggestionId>('pop')
  const left = MAX_STEPS - steps.length
  const fits = SUGGESTED_PROGRESSIONS.find(({ id }) => id === suggestion)!.steps.length <= left

  useEffect(() => {
    const target = focusAfter.current?.()
    focusAfter.current = null
    target?.focus()
  })

  const buttons = (selector: string) =>
    blocksRef.current?.querySelectorAll<HTMLButtonElement>(selector) ?? []

  // The ✕ now in the removed step's place, else the one before, else the heading.
  const remove = (index: number) => {
    focusAfter.current = () => {
      const removes = buttons('.progression-remove')
      return removes[Math.min(index, removes.length - 1)] ?? headingRef.current
    }
    onRemove(index)
  }

  // The same arrow of the moved step, or its other one if that end was reached.
  const move = (index: number, to: number) => {
    const [same, other] = to < index ? ['earlier', 'later'] : ['later', 'earlier']
    focusAfter.current = () => {
      const arrow = buttons(`.progression-move-${same}`)[to]
      return arrow?.disabled ? buttons(`.progression-move-${other}`)[to] : arrow
    }
    onMove(index, to)
  }

  const ask = (open: boolean) => {
    focusAfter.current = () => (open ? cancelRef : clearRef).current
    setConfirming(open)
  }

  const clear = () => {
    focusAfter.current = () => headingRef.current
    setConfirming(false)
    onClear()
  }

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
                    <li
                      key={index}
                      className={`chord--${quality}${playing === index ? ' is-playing' : ''}`}
                    >
                      <button
                        type="button"
                        className="progression-move progression-move-earlier"
                        aria-label={t.moveEarlier(shown, index + 1)}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        className="progression-step"
                        aria-current={playing === index ? 'step' : undefined}
                        onClick={() => onOpen(index)}
                      >
                        <span className="progression-roman">{displayRoman(roman)}</span> {shown}
                        <span className="sr-only">{t.stepNumber(index + 1)}</span>
                      </button>
                      <button
                        type="button"
                        className="progression-move progression-move-later"
                        aria-label={t.moveLater(shown, index + 1)}
                        disabled={index === steps.length - 1}
                        onClick={() => move(index, index + 1)}
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        className="progression-remove"
                        aria-label={t.removeStep(shown, index + 1)}
                        onClick={() => remove(index)}
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
      <div className="progression-suggestions">
        <label htmlFor={suggestionId}>{t.suggested}</label>
        {/* Choosing does nothing until + Add: arrow keys on a closed select change it (WCAG 3.2.2). */}
        <select
          id={suggestionId}
          value={suggestion}
          onChange={(event) => setSuggestion(event.currentTarget.value as SuggestionId)}
        >
          {SUGGESTED_PROGRESSIONS.map(({ id }) => (
            <option key={id} value={id}>
              {t.suggestions[id]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="play"
          aria-label={t.addTo(t.suggestions[suggestion])}
          aria-disabled={!fits}
          aria-describedby={fits ? undefined : `${suggestionId}-notice`}
          onClick={fits ? () => onAddSuggestion(suggestion) : undefined}
        >
          {t.add}
        </button>
        {!fits && (
          <p id={`${suggestionId}-notice`} className="progression-notice">
            {t.doesNotFit(left)}
          </p>
        )}
      </div>
      <div className="progression-controls">
        <div role="group" aria-label={t.playback} className="progression-playback">
          <button
            type="button"
            className="play"
            aria-label={playing === null ? t.play : t.stop}
            disabled={steps.length === 0}
            onClick={playing === null ? onPlay : onStop}
          >
            {playing === null ? `▶ ${t.play}` : `■ ${t.stop}`}
          </button>
          <label htmlFor={bpmId}>{t.bpm}</label>
          {/* Uncontrolled, so a value can be typed through out-of-range ones (1, 12, 120); only a
            valid tempo is applied, and leaving the field shows the tempo in use. */}
          <input
            id={bpmId}
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            defaultValue={bpm}
            onChange={({ currentTarget: { valueAsNumber: value } }) => {
              if (Number.isInteger(value) && value >= MIN_BPM && value <= MAX_BPM)
                onBpmChange(value)
            }}
            onBlur={({ currentTarget }) => {
              currentTarget.value = String(bpm)
            }}
          />
          {/* `play` is the shared pill style of the chord panel's buttons, not a play action. */}
          <button
            type="button"
            className="play"
            aria-pressed={loop}
            onClick={() => onLoopChange(!loop)}
          >
            {t.loop}
          </button>
        </div>
        {/* Confirmed in place: the viewer has no usable confirm(). Cancel, the safe answer, gets
          the focus. */}
        {confirming ? (
          <div
            role="group"
            aria-labelledby={`${labelId}-clear`}
            className="progression-clear"
            onKeyDown={(event) => {
              if (event.key === 'Escape') ask(false)
            }}
          >
            <span id={`${labelId}-clear`}>{t.clearQuestion}</span>
            <button type="button" className="play" onClick={clear}>
              {t.clearConfirm}
            </button>
            <button ref={cancelRef} type="button" className="play" onClick={() => ask(false)}>
              {t.cancel}
            </button>
          </div>
        ) : (
          <button
            ref={clearRef}
            type="button"
            className="play"
            disabled={steps.length === 0}
            onClick={() => ask(true)}
          >
            {t.clear}
          </button>
        )}
      </div>
      <div className="sr-only" aria-live="polite">
        <span key={announcement.id}>{announcement.text}</span>
      </div>
    </div>
  )
}
