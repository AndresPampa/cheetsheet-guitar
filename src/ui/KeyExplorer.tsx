import { useState } from 'react'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
  type KeyMode,
} from '../theory/index.ts'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { KeyPanel } from './KeyPanel.tsx'

interface Selection {
  tonic: string
  mode: KeyMode
}

const DEFAULT_SELECTION: Selection = { tonic: 'C', mode: 'major' }

/** The circle plus the selected key's summary. Owns the selection until `state` (URL) lands. */
export function KeyExplorer() {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION)
  const keyInfo = getKey(selection.tonic, selection.mode)
  const { index, alternate } = getCircleSpelling(selection.tonic, selection.mode)

  const select = ({ index: target, ring }: CircleSelection) => {
    setSelection({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring })
  }

  const respell = (tonic: string) => setSelection({ tonic, mode: selection.mode })

  return (
    <div className="key-explorer">
      <CircleOfFifths
        selected={{ index, ring: selection.mode }}
        highlights={getCircleHighlights(keyInfo)}
        onSelect={select}
      />
      <KeyPanel keyInfo={keyInfo} alternate={alternate} onRespell={respell} />
    </div>
  )
}
