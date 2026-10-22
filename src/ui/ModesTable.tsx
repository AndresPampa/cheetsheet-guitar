import type { Mode, ModeName } from '../theory/index.ts'
import type { ChordKind } from './KeyPanel.tsx'
import { characteristicText, displayRoman, displaySymbol, greekModeName } from './notation.ts'
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
  return (
    <div className="modes-table">
      <div className="modes-table-scroll">
        <table>
          <caption>Modos paralelos de {displaySymbol(root)}</caption>
          <thead>
            <tr>
              <th scope="col">Modo</th>
              <th scope="col">Nota característica</th>
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
                  <span className="mode-name">{greekModeName(mode.name)}</span>{' '}
                  <span className="mode-scale">{mode.scale.map(displaySymbol).join(' ')}</span>
                </th>
                <td className="mode-characteristic">
                  {mode.characteristic === null ? (
                    <>
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">ninguna (referencia)</span>
                    </>
                  ) : (
                    characteristicText(mode.characteristic.interval, mode.characteristic.note)
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
                        <span className="chord-symbol">{displaySymbol(shown.symbol)}</span>
                        {chord.star && (
                          <>
                            <span aria-hidden="true"> ⭐</span>
                            <span className="sr-only"> (más representativo)</span>
                          </>
                        )}
                        {shown.hasCharacteristic && (
                          <span className="sr-only"> (característica)</span>
                        )}
                        {shown.differsFromIonian && <span className="sr-only"> (prestado)</span>}
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
        ⭐ más representativo · <span className="legend-characteristic">subrayado</span>: contiene
        la nota característica · <span className="legend-borrowed">borde punteado</span>: prestado
        (difiere del jónico)
      </p>
    </div>
  )
}
