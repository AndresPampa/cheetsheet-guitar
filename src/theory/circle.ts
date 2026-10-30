import { Note } from 'tonal'
import { getKey, type ChordQuality, type Key, type KeyMode } from './key.ts'

export interface CircleSpelling {
  /** Spelling used when the sector is selected (fewer accidentals; F#/D#m on the tie). */
  tonic: string
  /** Enharmonic spelling of the same key, only at the three ambiguous positions. */
  alternate?: string
}

/** Major keys outside, relative minors in the middle, each major key's vii° innermost. */
export type CircleRing = Exclude<ChordQuality, 'augmented'>

export interface CirclePosition {
  /** 0 = C / Am at the top, increasing clockwise by fifths. */
  index: number
  major: CircleSpelling
  minor: CircleSpelling
  /** The vii° of this position's major key (read-only: a chord, not a key). */
  diminished: CircleSpelling
}

export interface CircleHighlight {
  index: number
  ring: CircleRing
  roman: string
  symbol: string
}

type Spellings = [primary: string, alternate?: string]

const POSITIONS: Array<[major: Spellings, minor: Spellings, diminished: Spellings]> = [
  [['C'], ['A'], ['B']],
  [['G'], ['E'], ['F#']],
  [['D'], ['B'], ['C#']],
  [['A'], ['F#'], ['G#']],
  [['E'], ['C#'], ['D#']],
  [
    ['B', 'Cb'],
    ['G#', 'Ab'],
    ['A#', 'Bb'],
  ],
  [
    ['F#', 'Gb'],
    ['D#', 'Eb'],
    ['E#', 'F'],
  ],
  [
    ['Db', 'C#'],
    ['Bb', 'A#'],
    ['C', 'B#'],
  ],
  [['Ab'], ['F'], ['G']],
  [['Eb'], ['C'], ['D']],
  [['Bb'], ['G'], ['A']],
  [['F'], ['D'], ['E']],
]

function spelling([tonic, alternate]: Spellings): Readonly<CircleSpelling> {
  return Object.freeze(alternate === undefined ? { tonic } : { tonic, alternate })
}

export const CIRCLE_OF_FIFTHS: readonly Readonly<CirclePosition>[] = Object.freeze(
  POSITIONS.map(([major, minor, diminished], index) =>
    Object.freeze({
      index,
      major: spelling(major),
      minor: spelling(minor),
      diminished: spelling(diminished),
    }),
  ),
)

/** Sector of a chord root on the given ring, matched by pitch class (so Cb lands on B/Cb). */
function indexByPitch(root: string, ring: CircleRing): number {
  const chroma = Note.chroma(root)
  return CIRCLE_OF_FIFTHS.findIndex((p) => Note.chroma(p[ring].tonic) === chroma)
}

/** Position on the circle of a key; throws RangeError if it is not one of the circle's keys. */
export function circleIndexOf(tonic: string, mode: KeyMode): number {
  getKey(tonic, mode)
  return indexByPitch(tonic, mode)
}

/**
 * Position of a key on the circle plus the other spelling of that same key, if the sector
 * has one (F# ↔ Gb, Db ↔ C#, B ↔ Cb and their relative minors). Throws RangeError for a
 * tonic that is not a key on the circle.
 */
export function getCircleSpelling(
  tonic: string,
  mode: KeyMode,
): { index: number; alternate: string | undefined } {
  const index = circleIndexOf(tonic, mode)
  const spelling = CIRCLE_OF_FIFTHS[index]![mode]
  return { index, alternate: tonic === spelling.tonic ? spelling.alternate : spelling.tonic }
}

/**
 * Where the key's seven diatonic chords sit on the circle: major chords on the outer ring,
 * minor chords in the middle and the diminished chord on the innermost ring.
 */
export function getCircleHighlights(key: Key): CircleHighlight[] {
  return key.chords.map(({ root, quality, roman, symbol }) => {
    // Unreachable: the circle's keys are major and natural minor, which have no augmented triad.
    if (quality === 'augmented') throw new Error(`no circle ring for the augmented ${symbol}`)
    return { index: indexByPitch(root, quality), ring: quality, roman, symbol }
  })
}
