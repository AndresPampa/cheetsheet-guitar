import { useId } from 'react'
import { useMessages } from '../i18n/index.ts'
import type { ChordKind } from '../state/index.ts'
import type { Extension, Key } from '../theory/index.ts'

const CHORD_KINDS: ChordKind[] = ['triads', 'sevenths']
const EXTENSIONS: Extension[] = [9, 11, 13]

interface KeyPanelProps {
  keyInfo: Key
  /** Enharmonic spelling of the same key, when the sector has one. */
  alternate: string | undefined
  onRespell: (tonic: string) => void
  chordKind: ChordKind
  onChordKindChange: (kind: ChordKind) => void
  /** Added to the open chord only, in stacking order; at most two. */
  extensions: Extension[]
  onExtensionsChange: (extensions: Extension[]) => void
  /** Opens (and plays) the chord on a degree of the key. */
  onChordClick: (degree: number) => void
  /** Switches the modes table to the harmonic minor; the shortcut shows only when given. */
  onHarmonicShortcut?: () => void
}

export function KeyPanel({
  keyInfo,
  alternate,
  onRespell,
  chordKind,
  onChordKindChange,
  extensions,
  onExtensionsChange,
  onChordClick,
  onHarmonicShortcut,
}: KeyPanelProps) {
  const t = useMessages()
  const mode = t.keyMode[keyInfo.mode]
  const noticeId = useId()
  const full = extensions.length === 2
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
      <div className="key-panel-switches">
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
        {/* Apart from Triads / Sevenths: these change the open chord, not the list below. */}
        <div className="key-panel-extensions">
          <span aria-hidden="true">{t.extensionsLabel}</span>
          <div className="segmented-switch" role="group" aria-label={t.extensionsGroup}>
            {EXTENSIONS.map((extension) => {
              const on = extensions.includes(extension)
              // aria-disabled instead of disabled: the full third keeps focus and says why.
              const blocked = full && !on
              const toggle = () => {
                if (blocked) return
                onExtensionsChange(
                  on
                    ? extensions.filter((chosen) => chosen !== extension)
                    : [...extensions, extension].sort((a, b) => a - b),
                )
              }
              return (
                <button
                  key={extension}
                  type="button"
                  aria-pressed={on}
                  aria-disabled={blocked}
                  aria-describedby={blocked ? noticeId : undefined}
                  onClick={toggle}
                >
                  {extension}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {full && (
        <p id={noticeId} className="extensions-notice">
          {t.maxExtensions}
        </p>
      )}
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
      {onHarmonicShortcut !== undefined && (
        <button type="button" className="harmonic-shortcut" onClick={onHarmonicShortcut}>
          {t.harmonicShortcut.chords} <span aria-hidden="true">→</span>
          <span className="sr-only"> {t.harmonicShortcut.joiner}</span> {t.harmonicShortcut.target}
        </button>
      )}
    </section>
  )
}
