import { Interval, Note } from 'tonal'
import { CIRCLE_TONICS, diatonicChords, type DiatonicChord, type SeventhChord } from './key.ts'

export type ModeName =
  'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'

/** Flags shared by a modal triad and its seventh chord. */
interface ModalFlags {
  /** Contains the mode's characteristic note (always false in ionian). */
  hasCharacteristic: boolean
  /** Differs from the ionian chord on the same degree: a borrowed chord. */
  differsFromIonian: boolean
}

export type ModalSeventh = SeventhChord & ModalFlags

/** A diatonic chord of a mode; `roman` is altered against the major scale (`bVII`, `#iv°`). */
export interface ModalChord extends DiatonicChord, ModalFlags {
  /** Curated: the chord that best evokes the mode. */
  star: boolean
  seventh: ModalSeventh
}

export interface Mode {
  name: ModeName
  /** Seven notes from the root, spelled with the root as given (double accidentals allowed). */
  scale: string[]
  /** The note that sets the mode apart; null for ionian, the reference row. */
  characteristic: { degree: number; note: string; interval: string } | null
  chords: ModalChord[]
}

interface ModeDefinition {
  name: ModeName
  characteristicDegree: number | null
  starDegrees: number[]
}

/** The modes of the major scale, as data: a mode's index is its rotation of the parent scale. */
const MODES: ModeDefinition[] = [
  { name: 'ionian', characteristicDegree: null, starDegrees: [] },
  { name: 'dorian', characteristicDegree: 6, starDegrees: [4] },
  { name: 'phrygian', characteristicDegree: 2, starDegrees: [2] },
  { name: 'lydian', characteristicDegree: 4, starDegrees: [2] },
  { name: 'mixolydian', characteristicDegree: 7, starDegrees: [7] },
  { name: 'aeolian', characteristicDegree: 6, starDegrees: [4, 6] },
  { name: 'locrian', characteristicDegree: 5, starDegrees: [5] },
]

// Any spelling of the parent scale works as a template: only the intervals are kept.
const MAJOR_TEMPLATE = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

function modeScale(root: string, rotation: number): string[] {
  const rotated = [...MAJOR_TEMPLATE.slice(rotation), ...MAJOR_TEMPLATE.slice(0, rotation)]
  return rotated.map((note) => Note.transpose(root, Interval.distance(rotated[0]!, note)))
}

/** `b`, `#`, `bb`… that a degree carries against the major scale of the same root. */
function alteration(root: string, note: string, majorNote: string): string {
  const diff =
    Interval.semitones(Interval.distance(root, note))! -
    Interval.semitones(Interval.distance(root, majorNote))!
  return diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff)
}

function characteristicOf(root: string, scale: string[], degree: number): Mode['characteristic'] {
  const note = scale[degree - 1]!
  return { degree, note, interval: Interval.distance(root, note) }
}

/**
 * The seven parallel modes of `root` (ionian → locrian). Throws RangeError for a root that is
 * not a tonic on the circle of fifths (major or minor spelling).
 */
export function getParallelModes(root: string): Mode[] {
  if (!CIRCLE_TONICS.major.has(root) && !CIRCLE_TONICS.minor.has(root)) {
    throw new RangeError(`"${root}" is not a root on the circle`)
  }
  const major = modeScale(root, 0)
  const ionian = diatonicChords(major)
  return MODES.map(({ name, characteristicDegree, starDegrees }, rotation) => {
    const scale = modeScale(root, rotation)
    const characteristic =
      characteristicDegree === null ? null : characteristicOf(root, scale, characteristicDegree)
    const note = characteristic?.note ?? null
    const chords = diatonicChords(scale).map((chord, i): ModalChord => {
      const prefix = alteration(root, chord.root, major[i]!)
      const reference = ionian[i]!
      return {
        ...chord,
        roman: prefix + chord.roman,
        star: starDegrees.includes(chord.degree),
        hasCharacteristic: note !== null && chord.notes.includes(note),
        differsFromIonian: chord.symbol !== reference.symbol,
        seventh: {
          ...chord.seventh,
          roman: prefix + chord.seventh.roman,
          hasCharacteristic: note !== null && chord.seventh.notes.includes(note),
          differsFromIonian: chord.seventh.symbol !== reference.seventh.symbol,
        },
      }
    })
    return { name, scale, characteristic, chords }
  })
}

/** Where a chord appears among the parallel modes of a root. */
export interface ModeMatch {
  mode: ModeName
  /** The chord's degree in that mode (triad or seventh roman, whichever matched). */
  roman: string
  star: boolean
}

/**
 * The parallel modes of `root` that contain the chord `symbol` (`F`, `Bb`, `F7`, `B°`…).
 * Triads and sevenths have distinct symbols, so one lookup serves both. Throws RangeError for a
 * root that is not on the circle.
 */
export function getModesContaining(root: string, symbol: string): ModeMatch[] {
  return getParallelModes(root).flatMap((mode) =>
    mode.chords.flatMap((chord) => {
      if (chord.symbol === symbol)
        return [{ mode: mode.name, roman: chord.roman, star: chord.star }]
      if (chord.seventh.symbol === symbol) {
        return [{ mode: mode.name, roman: chord.seventh.roman, star: chord.star }]
      }
      return []
    }),
  )
}
