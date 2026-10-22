import { useState } from 'react'
import type { AudioPort } from '../audio/index.ts'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
  getModesContaining,
  getParallelModes,
  type KeyMode,
  type ModeName,
} from '../theory/index.ts'
import { ChordDiagram, type VoicingsLoader } from './ChordDiagram.tsx'
import { ChordPanel } from './ChordPanel.tsx'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { KeyPanel, type ChordKind } from './KeyPanel.tsx'
import { ModesTable } from './ModesTable.tsx'
import { displaySymbol, greekModeName, modeName } from './notation.ts'
import type { DiagramDrawer } from './svguitarDiagram.ts'

interface Selection {
  tonic: string
  mode: KeyMode
}

/**
 * The chord open in the panel, by origin and degree rather than by value: it follows the
 * triads/sevenths switch and is recomputed from the current key and modes.
 */
interface ChordRef {
  source: 'key' | ModeName
  degree: number
}

const DEFAULT_SELECTION: Selection = { tonic: 'C', mode: 'major' }
const TONIC_CHORD: ChordRef = { source: 'key', degree: 1 }

// Injected services: the app passes Tone.js, chords-db and svguitar; tests pass fakes.
interface KeyExplorerProps {
  audio: AudioPort
  voicings: VoicingsLoader
  drawDiagram: DiagramDrawer
}

/**
 * The three panels (circle + key, parallel modes, chord). Owns the selection, the
 * triads/sevenths choice and the open chord until `state` (URL) lands.
 */
export function KeyExplorer({ audio, voicings, drawDiagram }: KeyExplorerProps) {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION)
  const [chordKind, setChordKind] = useState<ChordKind>('triads')
  const [chordRef, setChordRef] = useState<ChordRef>(TONIC_CHORD)
  const keyInfo = getKey(selection.tonic, selection.mode)
  const modes = getParallelModes(selection.tonic)
  const { index, alternate } = getCircleSpelling(selection.tonic, selection.mode)

  // Picking a key loads its tonic chord in the panel without playing it.
  const select = ({ index: target, ring }: CircleSelection) => {
    setSelection({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring })
    setChordRef(TONIC_CHORD)
  }

  const respell = (tonic: string) => {
    setSelection({ tonic, mode: selection.mode })
    setChordRef(TONIC_CHORD)
  }

  const resolve = ({ source, degree }: ChordRef) => {
    const chords =
      source === 'key' ? keyInfo.chords : modes.find((mode) => mode.name === source)!.chords
    const chord = chords[degree - 1]!
    // The root is the triad's: a seventh chord is built on the same one.
    return { ...(chordKind === 'sevenths' ? chord.seventh : chord), root: chord.root }
  }

  const open = (ref: ChordRef) => {
    setChordRef(ref)
    audio.playChord(resolve(ref).notes)
  }

  const chord = resolve(chordRef)
  const root = displaySymbol(selection.tonic)
  const context =
    chordRef.source === 'key'
      ? `${root} ${modeName(selection.mode)}`
      : `${root} ${greekModeName(chordRef.source).toLowerCase()}`

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
            onChordClick={(degree) => open({ source: 'key', degree })}
          />
        </div>
      </section>
      <section className="panel panel-modes" aria-label="Modos">
        <ModesTable
          root={selection.tonic}
          modes={modes}
          chordKind={chordKind}
          onChordClick={(source, degree) => open({ source, degree })}
        />
      </section>
      <section className="panel panel-chord" aria-label="Acorde seleccionado">
        <ChordPanel
          symbol={chord.symbol}
          roman={chord.roman}
          context={context}
          notes={chord.notes}
          modes={getModesContaining(selection.tonic, chord.symbol)}
          onPlay={() => audio.playChord(chord.notes)}
          diagram={
            <ChordDiagram
              name={displaySymbol(chord.symbol)}
              root={chord.root}
              quality={chord.quality}
              voicings={voicings}
              draw={drawDiagram}
            />
          }
        />
      </section>
    </main>
  )
}
