import { useEffect } from 'react'
import type { AudioPort } from '../audio/index.ts'
import { getMessages, MessagesContext, type Language, type Notation } from '../i18n/index.ts'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getExtendedChord,
  getKey,
  getModesContaining,
  getParallelModes,
} from '../theory/index.ts'
import { useTheme, useUrlState, type ChordRef } from '../state/index.ts'
import { ChordDiagram, type VoicingsLoader } from './ChordDiagram.tsx'
import { ChordPanel } from './ChordPanel.tsx'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { Credits } from './Credits.tsx'
import { KeyPanel } from './KeyPanel.tsx'
import { ModesTable } from './ModesTable.tsx'
import { SegmentedSwitch } from './SegmentedSwitch.tsx'
import type { DiagramDrawer } from './svguitarDiagram.ts'

const TONIC_CHORD: ChordRef = { source: 'key', degree: 1 }
// Each language named in itself and read in its own voice, so it is not spelled out ("E S").
const LANGUAGES: Array<{ value: Language; label: string; name: string; lang: string }> = [
  { value: 'es', label: 'ES', name: 'Español', lang: 'es' },
  { value: 'en', label: 'EN', name: 'English', lang: 'en' },
]
// Note names, not words: the same labels in every language.
const NOTATIONS: Array<{ value: Notation; label: string }> = [
  { value: 'letters', label: 'C D E' },
  { value: 'solfege', label: 'Do Re Mi' },
]

// Injected services: the app passes Tone.js, chords-db and svguitar; tests pass fakes.
interface AppShellProps {
  audio: AudioPort
  voicings: VoicingsLoader
  drawDiagram: DiagramDrawer
}

/**
 * The whole app: header with the global switches and the three panels (circle + key, chord,
 * parallel modes). The selected key, triads/sevenths, the open chord, the language and the note
 * naming live in the URL (`state`), validated there; the theme is a device preference.
 */
export function AppShell({ audio, voicings, drawDiagram }: AppShellProps) {
  const [state, update] = useUrlState()
  const { tonic, mode, chordKind, chord: chordRef, extensions, language, notation } = state
  const t = getMessages(language, notation)
  const [theme, setTheme] = useTheme()
  const keyInfo = getKey(tonic, mode)
  const modes = getParallelModes(tonic)
  const { index, alternate } = getCircleSpelling(tonic, mode)

  // Picking a key loads its tonic chord in the panel without playing it.
  const select = ({ index: target, ring }: CircleSelection) =>
    update({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring, chord: TONIC_CHORD })

  const respell = (respelled: string) => update({ tonic: respelled, chord: TONIC_CHORD })

  const resolve = ({ source, degree }: ChordRef) => {
    const origin = source === 'key' ? keyInfo : modes.find((parallel) => parallel.name === source)!
    const base = origin.chords[degree - 1]!
    // The roman stays the base chord's: Imaj7 for Cmaj9.
    const roman = chordKind === 'sevenths' ? base.seventh.roman : base.roman
    return { ...getExtendedChord(origin.scale, degree, chordKind, extensions), roman }
  }

  const open = (ref: ChordRef) => {
    update({ chord: ref })
    audio.playChord(resolve(ref).notes)
  }

  const chord = resolve(chordRef)
  const root = t.symbol(tonic)
  const context =
    chordRef.source === 'key' ? `${root} ${t.keyMode[mode]}` : t.modeContext(root, chordRef.source)

  // The page itself follows the language: screen readers pick the voice from `lang`.
  useEffect(() => {
    document.documentElement.lang = language
    document.title = t.appTitle
  }, [language, t])

  return (
    <MessagesContext value={t}>
      <div className="app">
        <header className="app-header">
          <h1>{t.appTitle}</h1>
          <div className="app-settings">
            <SegmentedSwitch
              label={t.languageGroup}
              options={LANGUAGES}
              value={language}
              onChange={(value) => update({ language: value })}
            />
            <SegmentedSwitch
              label={t.noteNamesGroup}
              options={NOTATIONS}
              value={notation}
              onChange={(value) => update({ notation: value })}
            />
            <SegmentedSwitch
              label={t.themeGroup}
              options={[
                { value: 'dark', label: '☾', name: t.themes.dark },
                { value: 'light', label: '☀', name: t.themes.light },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </div>
        </header>
        <main className="app-layout">
          <section className="panel panel-circle" aria-label={t.circleRegion}>
            <div className="key-explorer">
              <CircleOfFifths
                selected={{ index, ring: mode }}
                selectedSignature={keyInfo.signature}
                highlights={getCircleHighlights(keyInfo)}
                onSelect={select}
              />
              <KeyPanel
                keyInfo={keyInfo}
                alternate={alternate}
                onRespell={respell}
                chordKind={chordKind}
                onChordKindChange={(kind) => update({ chordKind: kind })}
                extensions={extensions}
                onExtensionsChange={(chosen) => update({ extensions: chosen })}
                onChordClick={(degree) => open({ source: 'key', degree })}
              />
            </div>
          </section>
          <section className="panel panel-chord" aria-label={t.chordRegion}>
            <ChordPanel
              symbol={chord.symbol}
              roman={chord.roman}
              context={context}
              notes={chord.notes}
              modes={getModesContaining(tonic, chord.notes)}
              onPlay={() => audio.playChord(chord.notes)}
              diagram={
                <ChordDiagram
                  name={t.symbol(chord.symbol)}
                  chord={chord}
                  voicings={voicings}
                  draw={drawDiagram}
                  theme={theme}
                />
              }
            />
          </section>
          <section className="panel panel-modes" aria-label={t.modesRegion}>
            <ModesTable
              root={tonic}
              modes={modes}
              chordKind={chordKind}
              onChordClick={(source, degree) => open({ source, degree })}
            />
          </section>
        </main>
        <Credits />
      </div>
    </MessagesContext>
  )
}
