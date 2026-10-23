import { useEffect, useRef, useState } from 'react'
import { useMessages, type Messages } from '../i18n/index.ts'
import type { Theme } from '../state/index.ts'
import type { Voicing, VoicingQuality } from '../voicings/index.ts'
import type { DiagramDrawer } from './svguitarDiagram.ts'

export type VoicingsLoader = (root: string, quality: VoicingQuality) => Promise<Voicing[]>

interface ChordDiagramProps {
  /** Display name of the chord, for the accessible description: `C`, `B♭maj7`. */
  name: string
  root: string
  quality: VoicingQuality
  voicings: VoicingsLoader
  draw: DiagramDrawer
  /** svguitar bakes the colors in when it draws: a new theme needs a new drawing. */
  theme: Theme
}

/** `x 3 2 0 1 0`, from the 6th string to the 1st, plus the starting fret when not at the nut. */
function tablature({ frets, baseFret }: Voicing, t: Messages): string {
  const strings = frets.map((fret) => (fret < 0 ? 'x' : String(fret))).join(' ')
  return baseFret > 1 ? `${strings}, ${t.fromFret(baseFret)}` : strings
}

/** The open chord on the fretboard, with every position the data has for it. */
export function ChordDiagram({ name, root, quality, voicings, draw, theme }: ChordDiagramProps) {
  const t = useMessages()
  const chord = `${root} ${quality}`
  // `list: null` records a failed load, so the panel says so instead of loading forever.
  const [loaded, setLoaded] = useState<{ chord: string; list: Voicing[] | null } | null>(null)
  // Remembered per chord, so a newly opened chord starts at its most common position.
  const [position, setPosition] = useState({ chord, index: 0 })
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let current = true
    voicings(root, quality).then(
      (list) => {
        if (current) setLoaded({ chord: `${root} ${quality}`, list })
      },
      (error: unknown) => {
        console.error('[diagram] could not load the voicings', error)
        if (current) setLoaded({ chord: `${root} ${quality}`, list: null })
      },
    )
    return () => {
      current = false
    }
  }, [voicings, root, quality])

  const state = loaded?.chord === chord ? loaded : undefined
  const list = state?.list
  const index = position.chord === chord ? position.index : 0
  const voicing = list?.[index]

  useEffect(() => {
    if (voicing !== undefined && container.current !== null) draw(container.current, voicing)
  }, [draw, voicing, theme])

  if (state === undefined) return <p className="chord-diagram-status">{t.loadingDiagram}</p>
  if (state.list === null) {
    return <p className="chord-diagram-status">{t.diagramFailed}</p>
  }
  if (voicing === undefined) {
    return <p className="chord-diagram-status">{t.noDiagram}</p>
  }

  const total = state.list.length
  const last = total - 1
  // aria-disabled instead of disabled: the button keeps keyboard focus at either end.
  const move = (step: number) => {
    const next = index + step
    if (next >= 0 && next <= last) setPosition({ chord, index: next })
  }
  return (
    <div className="chord-diagram">
      <figure
        className="chord-diagram-figure"
        role="img"
        aria-label={t.diagramLabel(name, tablature(voicing, t))}
      >
        <div ref={container} className="chord-diagram-svg" />
        <figcaption aria-hidden="true">{tablature(voicing, t)}</figcaption>
      </figure>
      <div className="chord-diagram-nav">
        <button
          type="button"
          aria-label={t.previousPosition}
          aria-disabled={index === 0}
          onClick={() => move(-1)}
        >
          ◀
        </button>
        <span aria-live="polite">{t.position(index + 1, total)}</span>
        <button
          type="button"
          aria-label={t.nextPosition}
          aria-disabled={index === last}
          onClick={() => move(1)}
        >
          ▶
        </button>
      </div>
    </div>
  )
}
