import { useId, type ReactNode } from 'react'
import { displayRoman, useMessages } from '../i18n/index.ts'
import { getChordFormula, parentScaleOf, type ModeMatch } from '../theory/index.ts'
import { ShownSpoken } from './ShownSpoken.tsx'
import './ChordPanel.css'

interface ChordPanelProps {
  symbol: string
  roman: string
  /** Where the chord was taken from, already translated: `C mayor`, `C Dorian`; `spoken` reads
   * the mode in words (`C locrio natural 6`). */
  context: { shown: string; spoken: string }
  notes: string[]
  /** Modes of the root, from every parent scale, that contain this chord. */
  modes: ModeMatch[]
  onPlay: () => void
  /** Appends the open chord to the progression. */
  onAdd: () => void
  /** The progression is at its limit: + Add stays focusable but says why and does nothing. */
  full: boolean
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
  onAdd,
  full,
  diagram,
}: ChordPanelProps) {
  const t = useMessages()
  const noticeId = useId()
  const shownSymbol = t.symbol(symbol)
  const formula = getChordFormula(notes)
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
        <button
          type="button"
          className="play"
          aria-label={t.addTo(shownSymbol)}
          aria-disabled={full}
          aria-describedby={full ? noticeId : undefined}
          onClick={full ? undefined : onAdd}
        >
          {t.add}
        </button>
      </div>
      {full && (
        <p id={noticeId} className="chord-panel-notice">
          {t.maxSteps}
        </p>
      )}
      <p>
        <ShownSpoken
          shown={t.degreeIn(displayRoman(roman), context.shown)}
          spoken={t.degreeIn(displayRoman(roman), context.spoken)}
        />
      </p>
      <div className="chord-panel-body">
        {diagram}
        <table className="chord-formula" aria-label={t.formulaOf(shownSymbol)}>
          <tbody>
            <tr>
              {formula.map((degree) => (
                <th key={degree} scope="col">
                  <span aria-hidden="true">{displayRoman(degree)}</span>
                  <span className="sr-only">{t.intervalName[degree] ?? degree}</span>
                </th>
              ))}
            </tr>
            <tr>
              {notes.map((note) => (
                <td key={note}>{t.symbol(note)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="chord-panel-modes-title">{t.appearsIn}</p>
      <ul className="chord-panel-modes" aria-label={t.modesContaining}>
        {modes.map((match) => (
          <li key={match.mode}>
            <ShownSpoken shown={t.modeName[match.mode]} spoken={t.modeSpoken[match.mode]} />{' '}
            {displayRoman(match.roman)}
            {match.star && (
              <>
                <span aria-hidden="true"> ⭐</span>
                <span className="sr-only"> {t.mostRepresentative}</span>
              </>
            )}{' '}
            ({t.parentScaleName[parentScaleOf(match.mode)]})
          </li>
        ))}
      </ul>
    </div>
  )
}
