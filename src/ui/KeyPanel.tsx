import type { Key } from '../theory/index.ts'
import { displaySymbol, modeName, signatureText } from './notation.ts'

/** Which chord on each degree the panel lists. The circle always shows triads. */
export type ChordKind = 'triads' | 'sevenths'

const CHORD_KINDS: Array<{ kind: ChordKind; label: string }> = [
  { kind: 'triads', label: 'Triadas' },
  { kind: 'sevenths', label: 'Séptimas' },
]

interface KeyPanelProps {
  keyInfo: Key
  /** Enharmonic spelling of the same key, when the sector has one. */
  alternate: string | undefined
  onRespell: (tonic: string) => void
  chordKind: ChordKind
  onChordKindChange: (kind: ChordKind) => void
  /** Opens (and plays) the chord on a degree of the key. */
  onChordClick: (degree: number) => void
}

export function KeyPanel({
  keyInfo,
  alternate,
  onRespell,
  chordKind,
  onChordKindChange,
  onChordClick,
}: KeyPanelProps) {
  const mode = modeName(keyInfo.mode)
  return (
    <section className="key-panel" aria-label="Tonalidad seleccionada">
      <div className="key-panel-header">
        <h2>
          {displaySymbol(keyInfo.tonic)} {mode}
        </h2>
        {alternate !== undefined && (
          <button type="button" className="respell" onClick={() => onRespell(alternate)}>
            Ver como {displaySymbol(alternate)} {mode}
          </button>
        )}
      </div>
      <p className="key-signature">{signatureText(keyInfo.signature)}</p>
      <div className="chord-kind" role="group" aria-label="Tipo de acorde">
        {CHORD_KINDS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            aria-pressed={chordKind === kind}
            onClick={() => onChordKindChange(kind)}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="chord-list" aria-label="Acordes diatónicos">
        {keyInfo.chords.map((chord) => {
          // Color stays the triad family (m7b5 reads as diminished, V7 as major).
          const { roman, symbol } = chordKind === 'sevenths' ? chord.seventh : chord
          return (
            <li key={chord.degree} className={`chord chord--${chord.quality}`}>
              <button
                type="button"
                className="chord-button"
                onClick={() => onChordClick(chord.degree)}
              >
                <span className="chord-roman">{roman}</span>{' '}
                <span className="chord-symbol">{displaySymbol(symbol)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
