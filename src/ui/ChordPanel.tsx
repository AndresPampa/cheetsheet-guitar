import type { ReactNode } from 'react'
import { displayRoman, displaySymbol, useMessages } from '../i18n/index.ts'
import type { ModeMatch } from '../theory/index.ts'
import './ChordPanel.css'

interface ChordPanelProps {
  symbol: string
  roman: string
  /** Where the chord was taken from, already translated: `C mayor`, `C Dorian`. */
  context: string
  notes: string[]
  /** Parallel modes of the root that contain this chord. */
  modes: ModeMatch[]
  onPlay: () => void
  /** The chord on the fretboard. */
  diagram: ReactNode
}

export function ChordPanel({
  symbol,
  roman,
  context,
  notes,
  modes,
  onPlay,
  diagram,
}: ChordPanelProps) {
  const t = useMessages()
  const shownSymbol = displaySymbol(symbol)
  return (
    <div className="chord-panel">
      {/* Announces the newly opened chord to screen readers. */}
      <div className="chord-panel-header" aria-live="polite">
        <h2>{shownSymbol}</h2>
        <button
          type="button"
          className="play"
          aria-label={t.listenTo(shownSymbol)}
          onClick={onPlay}
        >
          ▶ {t.listen}
        </button>
      </div>
      <p>{t.degreeIn(displayRoman(roman), context)}</p>
      <p>{t.notes(notes.map(displaySymbol).join(' '))}</p>
      {diagram}
      <p className="chord-panel-modes-title">{t.appearsIn}</p>
      <ul className="chord-panel-modes" aria-label={t.modesContaining}>
        {modes.map((match) => (
          <li key={match.mode}>
            {t.modeName[match.mode]} {displayRoman(match.roman)}
            {match.star && (
              <>
                <span aria-hidden="true"> ⭐</span>
                <span className="sr-only"> {t.mostRepresentative}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
