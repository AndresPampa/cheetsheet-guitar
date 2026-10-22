import { useState } from 'react'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
  type KeyMode,
} from '../theory/index.ts'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { KeyPanel, type ChordKind } from './KeyPanel.tsx'
import { ModesTable } from './ModesTable.tsx'

interface Selection {
  tonic: string
  mode: KeyMode
}

const DEFAULT_SELECTION: Selection = { tonic: 'C', mode: 'major' }

/**
 * The three panels (circle + key, parallel modes, chord). Owns the selection and the
 * triads/sevenths choice until `state` (URL) lands.
 */
export function KeyExplorer() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION)
  const [chordKind, setChordKind] = useState<ChordKind>('triads')
  const keyInfo = getKey(selection.tonic, selection.mode)
  const { index, alternate } = getCircleSpelling(selection.tonic, selection.mode)

  const select = ({ index: target, ring }: CircleSelection) => {
    setSelection({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring })
  }

  const respell = (tonic: string) => setSelection({ tonic, mode: selection.mode })

  return (
    <main className="app-layout">
      <section className="panel panel-circle" aria-label="Círculo de quintas">
        <div className="key-explorer">
          <CircleOfFifths
            selected={{ index, ring: selection.mode }}
            highlights={getCircleHighlights(keyInfo)}
            onSelect={select}
          />
          <KeyPanel
            keyInfo={keyInfo}
            alternate={alternate}
            onRespell={respell}
            chordKind={chordKind}
            onChordKindChange={setChordKind}
          />
        </div>
      </section>
      <section className="panel panel-modes" aria-label="Modos">
        <ModesTable root={selection.tonic} chordKind={chordKind} />
      </section>
      <section className="panel panel-chord" aria-label="Acorde seleccionado" />
    </main>
  )
}
