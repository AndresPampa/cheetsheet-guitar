import { Note } from 'tonal'
import { getKey, type Key, type KeyMode } from './key.ts'

export interface CircleSpelling {
  /** Spelling used when the sector is selected (fewer accidentals; F#/D#m on the tie). */
  tonic: string
  /** Enharmonic spelling of the same key, only at the three ambiguous positions. */
  alternate?: string
}

export interface CirclePosition {
  /** 0 = C / Am at the top, increasing clockwise by fifths. */
  index: number
  major: CircleSpelling
  minor: CircleSpelling
}

export interface CircleHighlight {
  index: number
  ring: KeyMode
  roman: string
  symbol: string
}

const POSITIONS: Array<[major: string, minor: string, majorAlt?: string, minorAlt?: string]> = [
  ['C', 'A'],
  ['G', 'E'],
  ['D', 'B'],
  ['A', 'F#'],
  ['E', 'C#'],
  ['B', 'G#', 'Cb', 'Ab'],
  ['F#', 'D#', 'Gb', 'Eb'],
  ['Db', 'Bb', 'C#', 'A#'],
  ['Ab', 'F'],
  ['Eb', 'C'],
  ['Bb', 'G'],
  ['F', 'D'],
]

export const CIRCLE_OF_FIFTHS: readonly Readonly<CirclePosition>[] = Object.freeze(
  POSITIONS.map(([major, minor, majorAlt, minorAlt], index) =>
    Object.freeze({
      index,
      major: Object.freeze(
        majorAlt === undefined ? { tonic: major } : { tonic: major, alternate: majorAlt },
      ),
      minor: Object.freeze(
        minorAlt === undefined ? { tonic: minor } : { tonic: minor, alternate: minorAlt },
      ),
    }),
  ),
)

/** Sector of a chord root on the given ring, matched by pitch class (so Cb lands on B/Cb). */
function indexByPitch(root: string, ring: KeyMode): number {
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
 * Where the key's diatonic chords sit on the circle: major chords on the outer ring, minor
 * chords on the inner one. The diminished chord has no sector and is left out.
 */
export function getCircleHighlights(key: Key): CircleHighlight[] {
  return key.chords.flatMap((chord) => {
    if (chord.quality === 'diminished') return []
    const ring: KeyMode = chord.quality
    return [
      { index: indexByPitch(chord.root, ring), ring, roman: chord.roman, symbol: chord.symbol },
    ]
  })
}
