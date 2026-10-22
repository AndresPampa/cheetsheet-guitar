import type { Key } from '../theory/index.ts'
import { displaySymbol, modeName, signatureText } from './notation.ts'

interface KeyPanelProps {
  keyInfo: Key
  /** Enharmonic spelling of the same key, when the sector has one. */
  alternate: string | undefined
  onRespell: (tonic: string) => void
}

export function KeyPanel({ keyInfo, alternate, onRespell }: KeyPanelProps) {
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
      <ol className="chord-list" aria-label="Acordes diatónicos">
        {keyInfo.chords.map((chord) => (
          <li key={chord.degree} className={`chord chord--${chord.quality}`}>
            <span className="chord-roman">{chord.roman}</span>{' '}
            <span className="chord-symbol">{displaySymbol(chord.symbol)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
