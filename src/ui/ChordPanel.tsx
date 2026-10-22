import type { ModeMatch } from '../theory/index.ts'
import { displayRoman, displaySymbol, greekModeName } from './notation.ts'
import './ChordPanel.css'

interface ChordPanelProps {
  symbol: string
  roman: string
  /** Where the chord was taken from: `C mayor`, `C dórico`. */
  context: string
  notes: string[]
  /** Parallel modes of the root that contain this chord. */
  modes: ModeMatch[]
  onPlay: () => void
}

export function ChordPanel({ symbol, roman, context, notes, modes, onPlay }: ChordPanelProps) {
  const shownSymbol = displaySymbol(symbol)
  return (
    <div className="chord-panel">
      {/* Announces the newly opened chord to screen readers. */}
      <div className="chord-panel-header" aria-live="polite">
        <h2>{shownSymbol}</h2>
        <button
          type="button"
          className="play"
          aria-label={`Escuchar ${shownSymbol}`}
          onClick={onPlay}
        >
          ▶ Escuchar
        </button>
      </div>
      <p>
        Grado {displayRoman(roman)} · {context}
      </p>
      <p>Notas: {notes.map(displaySymbol).join(' ')}</p>
      <p className="chord-panel-modes-title">Aparece en:</p>
      <ul className="chord-panel-modes" aria-label="Modos donde aparece">
        {modes.map((match) => (
          <li key={match.mode}>
            {greekModeName(match.mode)} {displayRoman(match.roman)}
            {match.star && (
              <>
                <span aria-hidden="true"> ⭐</span>
                <span className="sr-only"> (más representativo)</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
