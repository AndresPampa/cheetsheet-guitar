import { useMessages } from '../i18n/index.ts'
import type { ChordKind } from '../state/index.ts'
import type { Key } from '../theory/index.ts'

const CHORD_KINDS: ChordKind[] = ['triads', 'sevenths']

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
  const t = useMessages()
  const mode = t.keyMode[keyInfo.mode]
  return (
    <section className="key-panel" aria-label={t.keyRegion}>
      <div className="key-panel-header">
        <h2>
          {t.symbol(keyInfo.tonic)} {mode}
        </h2>
        {alternate !== undefined && (
          <button type="button" className="respell" onClick={() => onRespell(alternate)}>
            {t.respell(`${t.symbol(alternate)} ${mode}`)}
          </button>
        )}
      </div>
      <p className="key-signature">{t.signature(keyInfo.signature)}</p>
      <div className="chord-kind" role="group" aria-label={t.chordKindGroup}>
        {CHORD_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={chordKind === kind}
            onClick={() => onChordKindChange(kind)}
          >
            {t[kind]}
          </button>
        ))}
      </div>
      <ol className="chord-list" aria-label={t.diatonicChords}>
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
                <span className="chord-symbol">{t.symbol(symbol)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
