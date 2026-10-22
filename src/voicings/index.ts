import { Note } from 'tonal'
import type { ChordQuality, SeventhQuality } from '../theory/index.ts'

// Adapter over @tombatossals/chords-db (MIT). The data is loaded on first use so its ~240 kB
// stay out of the initial bundle.

export type VoicingQuality = ChordQuality | SeventhQuality

/** One way to play a chord. Strings go from the 6th (low E) to the 1st. */
export interface Voicing {
  /** Absolute fret per string: -1 muted, 0 open. */
  frets: number[]
  /** Finger per string: 0 = none, 1 index … 4 little finger. */
  fingers: number[]
  /** Lowest fret of the diagram window (1 = the nut). */
  baseFret: number
  /** Absolute frets held down by a barre. */
  barres: number[]
}

interface Position {
  frets: number[]
  fingers: number[]
  baseFret: number
  barres: number[]
}

interface GuitarDb {
  chords: Record<string, Array<{ suffix: string; positions: Position[] }>>
}

/** The data's 12 roots, by pitch class (C = 0); sharps are spelled out in its keys. */
const DB_ROOTS = ['C', 'Csharp', 'D', 'Eb', 'E', 'F', 'Fsharp', 'G', 'Ab', 'A', 'Bb', 'B']

const DB_SUFFIX: Record<VoicingQuality, string> = {
  major: 'major',
  minor: 'minor',
  diminished: 'dim',
  maj7: 'maj7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7b5',
}

/**
 * Errata: positions of the data that do not sound their chord, found by the voicings test's
 * catalogue invariant. Keyed by data root + suffix; values are position indexes to drop.
 * Indexes are only valid for the pinned chords-db 0.5.1: re-check this list on any version bump.
 */
const ERRATA: Record<string, { positions: number[]; reason: string }> = {
  'A dim': { positions: [1], reason: '5 3 x 4 3 x sounds A C B D, not A C Eb' },
}

let db: Promise<GuitarDb> | null = null

function loadDb(): Promise<GuitarDb> {
  db ??= import('@tombatossals/chords-db/lib/guitar.json')
    .then((module) => module.default as GuitarDb)
    .catch((error: unknown) => {
      db = null // a failed load is retried on the next call
      throw error
    })
  return db
}

/** The data stores frets relative to `baseFret`; the app works with absolute frets. */
function toVoicing({ frets, fingers, baseFret, barres }: Position): Voicing {
  const absolute = (fret: number) => (fret > 0 ? fret + baseFret - 1 : fret)
  return { frets: frets.map(absolute), fingers, baseFret, barres: barres.map(absolute) }
}

/**
 * The guitar voicings of a chord, most common first; `[]` if there are none. The root is found
 * by pitch (Gb uses the F# shapes, B# the C ones). Rejects with RangeError for an unreadable
 * note name.
 */
export async function loadVoicings(root: string, quality: VoicingQuality): Promise<Voicing[]> {
  const chroma = Note.chroma(root)
  if (chroma === undefined || Number.isNaN(chroma)) {
    throw new RangeError(`unknown note "${root}"`)
  }
  const { chords } = await loadDb()
  const dbRoot = DB_ROOTS[chroma]!
  const suffix = DB_SUFFIX[quality]
  const entry = chords[dbRoot]?.find((chord) => chord.suffix === suffix)
  const wrong = ERRATA[`${dbRoot} ${suffix}`]?.positions ?? []
  return (entry?.positions ?? []).filter((_, i) => !wrong.includes(i)).map(toVoicing)
}
