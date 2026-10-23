import type { AudioPort } from '../audio/index.ts'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
  getModesContaining,
  getParallelModes,
} from '../theory/index.ts'
import { useUrlState, type ChordRef } from '../state/index.ts'
import { ChordDiagram, type VoicingsLoader } from './ChordDiagram.tsx'
import { ChordPanel } from './ChordPanel.tsx'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { KeyPanel } from './KeyPanel.tsx'
import { ModesTable } from './ModesTable.tsx'
import { displaySymbol, greekModeName, modeName } from './notation.ts'
import type { DiagramDrawer } from './svguitarDiagram.ts'

const TONIC_CHORD: ChordRef = { source: 'key', degree: 1 }

// Injected services: the app passes Tone.js, chords-db and svguitar; tests pass fakes.
interface AppShellProps {
  audio: AudioPort
  voicings: VoicingsLoader
  drawDiagram: DiagramDrawer
}

/**
 * The whole app: header and the three panels (circle + key, chord, parallel modes). The
 * selected key, the triads/sevenths choice and the open chord live in the URL (`state`),
 * validated there.
 */
export function AppShell({ audio, voicings, drawDiagram }: AppShellProps) {
  const [state, update] = useUrlState()
  const { tonic, mode, chordKind, chord: chordRef } = state
  const keyInfo = getKey(tonic, mode)
  const modes = getParallelModes(tonic)
  const { index, alternate } = getCircleSpelling(tonic, mode)

  // Picking a key loads its tonic chord in the panel without playing it.
  const select = ({ index: target, ring }: CircleSelection) =>
    update({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring, chord: TONIC_CHORD })

  const respell = (respelled: string) => update({ tonic: respelled, chord: TONIC_CHORD })

  const resolve = ({ source, degree }: ChordRef) => {
    const chords =
      source === 'key' ? keyInfo.chords : modes.find((parallel) => parallel.name === source)!.chords
    const chord = chords[degree - 1]!
    // The root is the triad's: a seventh chord is built on the same one.
    return { ...(chordKind === 'sevenths' ? chord.seventh : chord), root: chord.root }
  }

  const open = (ref: ChordRef) => {
    update({ chord: ref })
    audio.playChord(resolve(ref).notes)
  }

  const chord = resolve(chordRef)
  const root = displaySymbol(tonic)
  const context =
    chordRef.source === 'key'
      ? `${root} ${modeName(mode)}`
      : `${root} ${greekModeName(chordRef.source).toLowerCase()}`

  return (
    <div className="app">
      <header className="app-header">
        <h1>Círculo de Quintas</h1>
      </header>
      <main className="app-layout">
        <section className="panel panel-circle" aria-label="Círculo de quintas">
          <div className="key-explorer">
            <CircleOfFifths
              selected={{ index, ring: mode }}
              highlights={getCircleHighlights(keyInfo)}
              onSelect={select}
            />
            <KeyPanel
              keyInfo={keyInfo}
              alternate={alternate}
              onRespell={respell}
              chordKind={chordKind}
              onChordKindChange={(kind) => update({ chordKind: kind })}
              onChordClick={(degree) => open({ source: 'key', degree })}
            />
          </div>
        </section>
        <section className="panel panel-chord" aria-label="Acorde seleccionado">
          <ChordPanel
            symbol={chord.symbol}
            roman={chord.roman}
            context={context}
            notes={chord.notes}
            modes={getModesContaining(tonic, chord.symbol)}
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
        <section className="panel panel-modes" aria-label="Modos">
          <ModesTable
            root={tonic}
            modes={modes}
            chordKind={chordKind}
            onChordClick={(source, degree) => open({ source, degree })}
          />
        </section>
      </main>
    </div>
  )
}
