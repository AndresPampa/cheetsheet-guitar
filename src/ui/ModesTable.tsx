import { displayRoman, useMessages } from '../i18n/index.ts'
import type { ChordKind } from '../state/index.ts'
import type { Mode, ModeName } from '../theory/index.ts'
import './ModesTable.css'

const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

interface ModesTableProps {
  root: string
  modes: Mode[]
  chordKind: ChordKind
  /** Opens (and plays) the chord on a degree of a mode. */
  onChordClick: (mode: ModeName, degree: number) => void
}

/** The seven parallel modes of `root`, one row per mode and one column per degree. */
export function ModesTable({ root, modes, chordKind, onChordClick }: ModesTableProps) {
  const t = useMessages()
  return (
    <div className="modes-table">
      <div className="modes-table-scroll">
        <table>
          <caption>{t.modesCaption(t.symbol(root))}</caption>
          <thead>
            <tr>
              <th scope="col">{t.modeColumn}</th>
              <th scope="col">{t.characteristicColumn}</th>
              {DEGREES.map((degree) => (
                <th key={degree} scope="col">
                  {degree}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modes.map((mode) => (
              <tr key={mode.name}>
                <th scope="row">
                  <span className="mode-name">{t.modeName[mode.name]}</span>{' '}
                  <span className="mode-scale">{mode.scale.map(t.symbol).join(' ')}</span>
                </th>
                <td className="mode-characteristic">
                  {mode.characteristic === null ? (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">{t.noCharacteristic}</span>
                    </>
                  ) : (
                    t.characteristic(mode.characteristic.interval, mode.characteristic.note)
                  )}
                </td>
                {mode.chords.map((chord) => {
                  const shown = chordKind === 'sevenths' ? chord.seventh : chord
                  const classes = [
                    'mode-chord',
                    `chord--${chord.quality}`,
                    shown.hasCharacteristic && 'has-characteristic',
                    shown.differsFromIonian && 'is-borrowed',
                  ]
                  return (
                    <td key={chord.degree} className={classes.filter(Boolean).join(' ')}>
                      <button
                        type="button"
                        className="chord-button"
                        onClick={() => onChordClick(mode.name, chord.degree)}
                      >
                        <span className="chord-roman">{displayRoman(shown.roman)}</span>{' '}
                        <span className="chord-symbol">{t.symbol(shown.symbol)}</span>
                        {chord.star && (
                          <>
                            <span aria-hidden="true"> ⭐</span>
                            <span className="sr-only"> {t.mostRepresentative}</span>
                          </>
                        )}
                        {shown.hasCharacteristic && (
                          <span className="sr-only"> {t.hasCharacteristic}</span>
                        )}
                        {shown.differsFromIonian && <span className="sr-only"> {t.borrowed}</span>}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="modes-legend">
        ⭐ {t.legend.star} · <span className="legend-characteristic">{t.legend.underlined}</span>:{' '}
        {t.legend.containsCharacteristic} ·{' '}
        <span className="legend-borrowed">{t.legend.dashed}</span>: {t.legend.borrowed}
      </p>
    </div>
  )
}
