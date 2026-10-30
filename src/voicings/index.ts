import { Note } from 'tonal'
import type { ExtendedChord } from '../theory/index.ts'

// Adapter over @tombatossals/chords-db (MIT). The data is loaded on first use so its ~240 kB
// stay out of the initial bundle.

/** What the search needs from a chord: theory's ASCII suffix and its notes. */
export type VoicingChord = Pick<ExtendedChord, 'root' | 'suffix' | 'notes'>

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

// The data names these in its own words; other suffixes are looked up as they are.
// A suffix it lacks gives no voicings.
const DB_SUFFIX: Record<string, string> = {
  '': 'major',
  m: 'minor',
  '°': 'dim',
  '+': 'aug',
  '°7': 'dim7',
  mMaj7: 'mmaj7',
  mMaj9: 'mmaj9',
  mMaj11: 'mmaj11',
}

const PERFECT_FIFTH = 7

/**
 * Errata: positions of the data that do not sound their chord, found by the voicings test's
 * catalogue invariant. Keyed by data root + suffix; values are position indexes to drop.
 * Indexes are only valid for the pinned chords-db 0.5.1: re-check this list on any version bump.
 * Redundant since the by-notes filter in `loadVoicings` also drops it; kept as documentation.
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

/** Pitch class of each sounding string, from the 6th to the 1st (standard tuning). */
const TUNING = [4, 9, 2, 7, 11, 4]

/**
 * The guitar voicings of a chord, most common first; `[]` if there are none. The root is found
 * by pitch (Gb uses the F# shapes, B# the C ones). Only positions that sound every note of the
 * chord (the perfect fifth may be left out) and nothing else are kept: the data's 11th and 13th
 * chords often drop the 9th. Rejects with RangeError for an unreadable note name.
 */
export async function loadVoicings({ root, suffix, notes }: VoicingChord): Promise<Voicing[]> {
  const chroma = Note.chroma(root)
  if (chroma === undefined || Number.isNaN(chroma)) {
    throw new RangeError(`unknown note "${root}"`)
  }
  const { chords } = await loadDb()
  const dbRoot = DB_ROOTS[chroma]!
  const dbSuffix = DB_SUFFIX[suffix] ?? suffix
  const entry = chords[dbRoot]?.find((chord) => chord.suffix === dbSuffix)
  const wrong = ERRATA[`${dbRoot} ${dbSuffix}`]?.positions ?? []
  const allowed = notes.map((note) => Note.chroma(note))
  const required = allowed.filter((pc) => (pc - chroma + 12) % 12 !== PERFECT_FIFTH)
  return (entry?.positions ?? [])
    .filter((_, i) => !wrong.includes(i))
    .map(toVoicing)
    .filter(({ frets }) => {
      const sounding = frets.flatMap((fret, string) =>
        fret < 0 ? [] : [(TUNING[string]! + fret) % 12],
      )
      return (
        sounding.every((pc) => allowed.includes(pc)) &&
        required.every((pc) => sounding.includes(pc))
      )
    })
}
