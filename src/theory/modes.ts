import { Interval, Note } from 'tonal'
import { CIRCLE_TONICS, diatonicChords, type DiatonicChord, type SeventhChord } from './key.ts'

export type ModeName =
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'harmonic-minor'
  | 'locrian-nat6'
  | 'ionian-sharp5'
  | 'dorian-sharp4'
  | 'phrygian-dominant'
  | 'lydian-sharp2'
  | 'superlocrian-bb7'
  | 'melodic-minor'
  | 'dorian-b2'
  | 'lydian-augmented'
  | 'lydian-dominant'
  | 'mixolydian-b6'
  | 'locrian-nat2'
  | 'altered'

/** The scale a family of modes rotates; `major` is the one v1 shows. */
export type ParentScale = 'major' | 'harmonic' | 'melodic'
export const PARENT_SCALES: readonly ParentScale[] = ['major', 'harmonic', 'melodic']

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

/**
 * Each parent scale as data: a template (any spelling works, only the intervals are kept) and its
 * modes, where a mode's index is its rotation of the template. The characteristic degree is the
 * one that differs from the closest major-scale mode.
 */
const CATALOG: Record<ParentScale, { template: string[]; modes: ModeDefinition[] }> = {
  major: {
    template: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    modes: [
      { name: 'ionian', characteristicDegree: null, starDegrees: [] },
      { name: 'dorian', characteristicDegree: 6, starDegrees: [4] },
      { name: 'phrygian', characteristicDegree: 2, starDegrees: [2] },
      { name: 'lydian', characteristicDegree: 4, starDegrees: [2] },
      { name: 'mixolydian', characteristicDegree: 7, starDegrees: [7] },
      { name: 'aeolian', characteristicDegree: 6, starDegrees: [4, 6] },
      { name: 'locrian', characteristicDegree: 5, starDegrees: [5] },
    ],
  },
  harmonic: {
    template: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
    modes: [
      { name: 'harmonic-minor', characteristicDegree: 7, starDegrees: [5] },
      { name: 'locrian-nat6', characteristicDegree: 6, starDegrees: [4] },
      { name: 'ionian-sharp5', characteristicDegree: 5, starDegrees: [1] },
      { name: 'dorian-sharp4', characteristicDegree: 4, starDegrees: [2] },
      { name: 'phrygian-dominant', characteristicDegree: 3, starDegrees: [1] },
      { name: 'lydian-sharp2', characteristicDegree: 2, starDegrees: [7] },
      // Differs from locrian in b4 too; only bb7, the one that names it, is marked.
      { name: 'superlocrian-bb7', characteristicDegree: 7, starDegrees: [1] },
    ],
  },
  melodic: {
    template: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
    modes: [
      { name: 'melodic-minor', characteristicDegree: 7, starDegrees: [5] },
      // As close to dorian (b2) as to phrygian (6M); the PRD measures it against phrygian.
      { name: 'dorian-b2', characteristicDegree: 6, starDegrees: [4] },
      { name: 'lydian-augmented', characteristicDegree: 5, starDegrees: [1] },
      // As close to mixolydian (#4) as to lydian (b7); the PRD measures it against lydian.
      { name: 'lydian-dominant', characteristicDegree: 7, starDegrees: [1] },
      { name: 'mixolydian-b6', characteristicDegree: 6, starDegrees: [4] },
      { name: 'locrian-nat2', characteristicDegree: 2, starDegrees: [7] },
      { name: 'altered', characteristicDegree: 4, starDegrees: [2] },
    ],
  },
}

export const MODE_NAMES: readonly ModeName[] = PARENT_SCALES.flatMap((parent) =>
  CATALOG[parent].modes.map((mode) => mode.name),
)

/** The parent scale a mode belongs to: `dorian` → `major`, `phrygian-dominant` → `harmonic`. */
export function parentScaleOf(mode: ModeName): ParentScale {
  return PARENT_SCALES.find((parent) => CATALOG[parent].modes.some((m) => m.name === mode))!
}

function modeScale(root: string, rotation: number, template: string[]): string[] {
  const rotated = [...template.slice(rotation), ...template.slice(0, rotation)]
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
 * The seven parallel modes of `root` from `parentScale` (major: ionian → locrian), with romans
 * and borrowed chords always measured against the major scale of `root`. Throws RangeError for
 * a root that is not a tonic on the circle of fifths (major or minor spelling).
 */
export function getParallelModes(root: string, parentScale: ParentScale = 'major'): Mode[] {
  if (!CIRCLE_TONICS.major.has(root) && !CIRCLE_TONICS.minor.has(root)) {
    throw new RangeError(`"${root}" is not a root on the circle`)
  }
  const major = modeScale(root, 0, CATALOG.major.template)
  const ionian = diatonicChords(major)
  const { template, modes } = CATALOG[parentScale]
  return modes.map(({ name, characteristicDegree, starDegrees }, rotation) => {
    const scale = modeScale(root, rotation, template)
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
 * The parallel modes of `root`, from each of `parentScales` in order, whose scale holds every note
 * of the chord, with `notes[0]` (its root, spelled the same) on one of the degrees. The roman is
 * the seventh's when the chord holds that degree's 7th, else the triad's; `parentScaleOf(mode)`
 * tells the scale. Throws RangeError for a root that is not on the circle.
 */
export function getModesContaining(
  root: string,
  notes: string[],
  parentScales: readonly ParentScale[] = ['major'],
): ModeMatch[] {
  const modes = parentScales.flatMap((parent) => getParallelModes(root, parent))
  return modes.flatMap((mode) => {
    const chord = mode.chords.find((candidate) => candidate.root === notes[0])
    if (chord === undefined || !notes.every((note) => mode.scale.includes(note))) return []
    const roman = notes.includes(chord.seventh.notes[3]!) ? chord.seventh.roman : chord.roman
    return [{ mode: mode.name, roman, star: chord.star }]
  })
}
