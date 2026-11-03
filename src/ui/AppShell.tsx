import { useEffect, useRef, useState } from 'react'
import type { AudioPort } from '../audio/index.ts'
import { getMessages, MessagesContext, type Language, type Notation } from '../i18n/index.ts'
import {
  CIRCLE_OF_FIFTHS,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
  getModesContaining,
  getParallelModes,
  PARENT_SCALES,
  parentScaleOf,
  resolveStep,
  type ProgressionStep,
} from '../theory/index.ts'
import { MAX_STEPS, useTheme, useUrlState, type ChordRef } from '../state/index.ts'
import { ChordDiagram, type VoicingsLoader } from './ChordDiagram.tsx'
import { ChordPanel } from './ChordPanel.tsx'
import { CircleOfFifths, type CircleSelection } from './CircleOfFifths.tsx'
import { Credits } from './Credits.tsx'
import { KeyPanel } from './KeyPanel.tsx'
import { ModesTable } from './ModesTable.tsx'
import { ProgressionPanel } from './ProgressionPanel.tsx'
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
  const { tonic, mode, chordKind, chord: chordRef, extensions, language, notation, scale } = state
  const { progression } = state
  // Set only by add and remove, so loading a progression from the URL announces nothing.
  const [announcement, setAnnouncement] = useState({ text: '', id: 0 })
  const t = getMessages(language, notation)
  const [theme, setTheme] = useTheme()
  const keyInfo = getKey(tonic, mode)
  const modes = getParallelModes(tonic, scale)
  const modesTableRef = useRef<HTMLTableElement>(null)
  const { index, alternate } = getCircleSpelling(tonic, mode)

  // Picking a key loads its tonic chord in the panel without playing it.
  const select = ({ index: target, ring }: CircleSelection) =>
    update({ tonic: CIRCLE_OF_FIFTHS[target]![ring].tonic, mode: ring, chord: TONIC_CHORD })

  const respell = (respelled: string) => update({ tonic: respelled, chord: TONIC_CHORD })

  // The open chord, as a step: what the panel shows and what + Add appends.
  const openStep: ProgressionStep = { ...chordRef, kind: chordKind, extensions }
  const chord = resolveStep(tonic, mode, openStep)
  const steps = progression.map((step) => resolveStep(tonic, mode, step))

  // A new id remounts the text, so the same message twice (two "C quitado") is read twice.
  const announce = (text: string) => setAnnouncement(({ id }) => ({ text, id: id + 1 }))

  const addStep = () => {
    update({ progression: [...progression, openStep] })
    announce(t.stepAdded(t.symbol(chord.symbol), progression.length + 1, progression.length + 1))
  }

  const removeStep = (index: number) => {
    update({ progression: progression.filter((_, position) => position !== index) })
    announce(t.stepRemoved(t.symbol(steps[index]!.symbol)))
  }

  // A modal step brings its parent scale, so normalize keeps it open; a key step keeps the table.
  const openStepAt = (index: number) => {
    const { source, degree, kind, extensions: added } = progression[index]!
    update({
      chord: { source, degree },
      chordKind: kind,
      extensions: added,
      ...(source === 'key' ? {} : { scale: parentScaleOf(source) }),
    })
    audio.playChord(steps[index]!.notes)
  }

  const open = (ref: ChordRef) => {
    update({ chord: ref })
    audio.playChord(resolveStep(tonic, mode, { ...ref, kind: chordKind, extensions }).notes)
  }

  const root = t.symbol(tonic)
  const keyContext = `${root} ${t.keyMode[mode]}`
  const context =
    chordRef.source === 'key'
      ? { shown: keyContext, spoken: keyContext }
      : {
          shown: t.modeContext(root, chordRef.source),
          spoken: t.modeContextSpoken(root, chordRef.source),
        }

  // The table node stays the same across the scale change; focus() also scrolls it into view.
  const showHarmonic = () => {
    update({ scale: 'harmonic' })
    modesTableRef.current?.focus()
  }

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
                onHarmonicShortcut={
                  mode === 'minor' && scale !== 'harmonic' ? showHarmonic : undefined
                }
              />
            </div>
          </section>
          <section className="panel panel-chord" aria-label={t.chordRegion}>
            <ChordPanel
              symbol={chord.symbol}
              roman={chord.roman}
              context={context}
              notes={chord.notes}
              modes={getModesContaining(tonic, chord.notes, PARENT_SCALES)}
              onPlay={() => audio.playChord(chord.notes)}
              onAdd={addStep}
              full={progression.length >= MAX_STEPS}
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
          <section className="panel panel-progression" aria-label={t.progressionRegion}>
            <ProgressionPanel
              steps={steps}
              announcement={announcement}
              onOpen={openStepAt}
              onRemove={removeStep}
            />
          </section>
          <section className="panel panel-modes" aria-label={t.modesRegion}>
            <ModesTable
              root={tonic}
              scale={scale}
              onScaleChange={(chosen) => update({ scale: chosen })}
              modes={modes}
              anchor={scale === 'major' ? (mode === 'major' ? 'ionian' : 'aeolian') : null}
              tableRef={modesTableRef}
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
