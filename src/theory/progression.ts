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
