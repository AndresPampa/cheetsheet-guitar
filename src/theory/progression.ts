import {
  getExtendedChord,
  type ChordBase,
  type ExtendedChord,
  type Extension,
} from './extensions.ts'
import { getKey, type ChordQuality, type KeyMode } from './key.ts'
import { getParallelModes, parentScaleOf, type ModeName } from './modes.ts'

/**
 * A chord by origin and degree, not by value: a `'key'` step follows the key and its mode, a
 * modal step follows only the root. Also what the chord panel resolves for the open chord.
 */
export interface ProgressionStep {
  source: 'key' | ModeName
  degree: number
  kind: ChordBase
  extensions: Extension[]
}

/**
 * Resolves `step` in the key `tonic` `keyMode`: a `'key'` step with the key panel's romans
 * (`III` in minor), a modal step in its own parent scale with the modes table's (`bIII`). The
 * roman is the base chord's: `Imaj7` for Cmaj9; the quality is the triad family, as the chips
 * color it (`Bm7b5` is `diminished`). Throws like `getKey` and `getExtendedChord`.
 */
export function resolveStep(
  tonic: string,
  keyMode: KeyMode,
  { source, degree, kind, extensions }: ProgressionStep,
): ExtendedChord & { roman: string; quality: ChordQuality } {
  const origin =
    source === 'key'
      ? getKey(tonic, keyMode)
      : getParallelModes(tonic, parentScaleOf(source)).find((mode) => mode.name === source)!
  const base = origin.chords[degree - 1]!
  const roman = kind === 'sevenths' ? base.seventh.roman : base.roman
  return {
    ...getExtendedChord(origin.scale, degree, kind, extensions),
    roman,
    quality: base.quality,
  }
}

export type SuggestionId = 'pop' | 'ii-V-I' | 'turnaround' | 'andalusian' | 'mixolydian' | 'blues'

const chords = (kind: ChordBase, ...steps: Array<[ModeName, number]>): ProgressionStep[] =>
  steps.map(([source, degree]) => ({ source, degree, kind, extensions: [] }))

// Blues dominants: I7 from mixolydian, IV7 from dorian, V7 from ionian.
const I7: [ModeName, number] = ['mixolydian', 1]
const IV7: [ModeName, number] = ['dorian', 4]
const V7: [ModeName, number] = ['ionian', 5]

/**
 * Curated progressions, relative to a root. Explicit modes, never `'key'`: loaded in a minor key
 * they keep the sound their name says (`I–V–vi–IV` in A minor is A E F#m D).
 */
export const SUGGESTED_PROGRESSIONS: ReadonlyArray<{
  id: SuggestionId
  steps: ProgressionStep[]
}> = [
  {
    id: 'pop',
    steps: chords('triads', ['ionian', 1], ['ionian', 5], ['ionian', 6], ['ionian', 4]),
  },
  {
    id: 'ii-V-I',
    steps: chords('sevenths', ['ionian', 2], ['ionian', 5], ['ionian', 1]),
  },
  {
    id: 'turnaround',
    steps: chords('triads', ['ionian', 1], ['ionian', 6], ['ionian', 2], ['ionian', 5]),
  },
  // The major V comes from harmonic minor: Am G F E.
  {
    id: 'andalusian',
    steps: chords('triads', ['aeolian', 1], ['aeolian', 7], ['aeolian', 6], ['harmonic-minor', 5]),
  },
  {
    id: 'mixolydian',
    steps: chords('triads', ['mixolydian', 1], ['mixolydian', 7], ['mixolydian', 4]),
  },
  {
    id: 'blues',
    steps: chords('sevenths', I7, I7, I7, I7, IV7, IV7, I7, I7, V7, IV7, I7, V7),
  },
]
