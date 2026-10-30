import type { Ref } from 'react'
import { displayRoman, useMessages } from '../i18n/index.ts'
import type { ChordKind } from '../state/index.ts'
import { PARENT_SCALES, type Mode, type ModeName, type ParentScale } from '../theory/index.ts'
import { SegmentedSwitch } from './SegmentedSwitch.tsx'
import { ShownSpoken } from './ShownSpoken.tsx'
import './ModesTable.css'

const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

interface ModesTableProps {
  root: string
  scale: ParentScale
  onScaleChange: (scale: ParentScale) => void
  modes: Mode[]
  /** The row of the selected key (ionian or aeolian), when the table shows the major scale. */
  anchor: ModeName | null
  /** Focused by the harmonic-minor shortcut of the key panel. */
  tableRef: Ref<HTMLTableElement>
  chordKind: ChordKind
  /** Opens (and plays) the chord on a degree of a mode. */
  onChordClick: (mode: ModeName, degree: number) => void
}

/**
 * The seven modes of `root` from the chosen parent scale, one row per mode and one column per
 * degree, under the parent-scale switch.
 */
export function ModesTable({
  root,
  scale,
  onScaleChange,
  modes,
  anchor,
  tableRef,
  chordKind,
  onChordClick,
}: ModesTableProps) {
  const t = useMessages()
  return (
    <div className="modes-table">
      <div className="modes-table-scale">
        <span aria-hidden="true">{t.parentScaleGroup}</span>
        <SegmentedSwitch
          label={t.parentScaleGroup}
          options={PARENT_SCALES.map((parent) => ({
            value: parent,
            label: t.parentScaleShort[parent],
            name: t.parentScaleName[parent],
          }))}
          value={scale}
          onChange={onScaleChange}
        />
      </div>
      <div className="modes-table-scroll">
        <table ref={tableRef} tabIndex={-1}>
          <caption>{t.modesCaption(t.symbol(root), scale)}</caption>
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
              <tr key={mode.name} className={mode.name === anchor ? 'is-anchor' : undefined}>
                <th scope="row">
                  <ShownSpoken
                    className="mode-name"
                    shown={t.modeName[mode.name]}
                    spoken={t.modeSpoken[mode.name]}
                  />{' '}
                  {mode.name === anchor && (
                    <>
                      <span className="mode-anchor">{t.yourKey}</span>{' '}
                    </>
                  )}
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
