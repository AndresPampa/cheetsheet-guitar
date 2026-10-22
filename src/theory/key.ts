import { Interval, Key as TonalKey } from 'tonal'

export type KeyMode = 'major' | 'minor'
export type ChordQuality = 'major' | 'minor' | 'diminished'
export type SeventhQuality = 'maj7' | 'm7' | '7' | 'm7b5'

/** The four-note chord on a degree: triad plus the diatonic seventh. */
export interface SeventhChord {
  quality: SeventhQuality
  /** `Imaj7`, `ii7`, `V7`, `viiø7`. */
  roman: string
  /** Display symbol: `Cmaj7`, `Dm7`, `G7`, `Bm7b5`. */
  symbol: string
  notes: string[]
}

export interface DiatonicChord {
  /** 1–7, relative to the key's own scale (in minor, 3 is the relative major). */
  degree: number
  /** Uppercase = major, lowercase = minor, `°` = diminished. */
  roman: string
  root: string
  quality: ChordQuality
  /** Display symbol: `C`, `Dm`, `B°`. */
  symbol: string
  notes: string[]
  /** Same degree as a seventh chord. `quality` above stays the triad family. */
  seventh: SeventhChord
}

export interface KeySignature {
  accidental: 'none' | 'sharp' | 'flat'
  /** In canonical order: F C G D A E B for sharps, B E A D G C F for flats. */
  notes: string[]
}

export interface Key {
  tonic: string
  mode: KeyMode
  /** Seven notes, one letter per degree (correct enharmonic spelling). */
  scale: string[]
  signature: KeySignature
  chords: DiatonicChord[]
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
const SHARP_ORDER = 'FCGDAEB'
const FLAT_ORDER = 'BEADGCF'
/**
 * The 15 spellings per mode on the circle of fifths (0–7 sharps or flats), including the
 * enharmonic pairs. Theoretical keys such as Fb major or Db minor are rejected.
 */
export const CIRCLE_TONICS: Record<KeyMode, ReadonlySet<string>> = {
  major: new Set([
    'C',
    'G',
    'D',
    'A',
    'E',
    'B',
    'F#',
    'C#',
    'F',
    'Bb',
    'Eb',
    'Ab',
    'Db',
    'Gb',
    'Cb',
  ]),
  minor: new Set([
    'A',
    'E',
    'B',
    'F#',
    'C#',
    'G#',
    'D#',
    'A#',
    'D',
    'G',
    'C',
    'F',
    'Bb',
    'Eb',
    'Ab',
  ]),
}

/** Triad quality from the intervals above the root (third, fifth). */
const TRIAD_QUALITIES: Record<string, ChordQuality> = {
  '3M5P': 'major',
  '3m5P': 'minor',
  '3m5d': 'diminished',
}

const SYMBOL_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: '°',
}

/** Seventh-chord quality from the intervals above the root (third, fifth, seventh). */
const SEVENTH_QUALITIES: Record<string, SeventhQuality> = {
  '3M5P7M': 'maj7',
  '3m5P7m': 'm7',
  '3M5P7m': '7',
  '3m5d7m': 'm7b5',
}

/** Roman numeral case and suffix per seventh quality: `IVmaj7`, `V7`, `ii7`, `viiø7`. */
const SEVENTH_ROMAN: Record<SeventhQuality, { upper: boolean; suffix: string }> = {
  maj7: { upper: true, suffix: 'maj7' },
  '7': { upper: true, suffix: '7' },
  m7: { upper: false, suffix: '7' },
  m7b5: { upper: false, suffix: 'ø7' },
}

function scaleOf(tonic: string, mode: KeyMode): string[] {
  return mode === 'major'
    ? TonalKey.majorKey(tonic).scale.slice()
    : TonalKey.minorKey(tonic).natural.scale.slice()
}

function triadQuality(root: string, third: string, fifth: string): ChordQuality {
  const shape = Interval.distance(root, third) + Interval.distance(root, fifth)
  const quality = TRIAD_QUALITIES[shape]
  // Unreachable for major / natural-minor scales; guards future scales (v2) loudly.
  if (quality === undefined) throw new Error(`unsupported triad shape ${shape} on ${root}`)
  return quality
}

function romanFor(degree: number, quality: ChordQuality): string {
  const numeral = ROMANS[degree - 1]!
  if (quality === 'major') return numeral
  if (quality === 'diminished') return `${numeral.toLowerCase()}°`
  return numeral.toLowerCase()
}

function seventhChord(degree: number, notes: [string, string, string, string]): SeventhChord {
  const [root, third, fifth, seventh] = notes
  const shape =
    Interval.distance(root, third) +
    Interval.distance(root, fifth) +
    Interval.distance(root, seventh)
  const quality = SEVENTH_QUALITIES[shape]
  // Unreachable for major / natural-minor scales; guards future scales (v2) loudly.
  if (quality === undefined) throw new Error(`unsupported seventh shape ${shape} on ${root}`)
  const numeral = ROMANS[degree - 1]!
  const { upper, suffix } = SEVENTH_ROMAN[quality]
  const roman = (upper ? numeral : numeral.toLowerCase()) + suffix
  // The quality names double as chord-symbol suffixes: Cmaj7, Dm7, G7, Bm7b5.
  return { quality, roman, symbol: root + quality, notes }
}

export function diatonicChords(scale: string[]): DiatonicChord[] {
  return scale.map((root, i) => {
    // Stacked thirds wrap around the 7-note scale, so the index is always in range.
    const third = scale[(i + 2) % 7]!
    const fifth = scale[(i + 4) % 7]!
    const seventh = scale[(i + 6) % 7]!
    const quality = triadQuality(root, third, fifth)
    const degree = i + 1
    return {
      degree,
      roman: romanFor(degree, quality),
      root,
      quality,
      symbol: root + SYMBOL_SUFFIX[quality],
      notes: [root, third, fifth],
      seventh: seventhChord(degree, [root, third, fifth, seventh]),
    }
  })
}

function signatureOf(scale: string[]): KeySignature {
  const sharps = scale.filter((n) => n.includes('#'))
  const flats = scale.filter((n) => n.includes('b'))
  const byLetter = (order: string) => (a: string, b: string) =>
    order.indexOf(a.charAt(0)) - order.indexOf(b.charAt(0))
  if (sharps.length > 0) return { accidental: 'sharp', notes: sharps.sort(byLetter(SHARP_ORDER)) }
  if (flats.length > 0) return { accidental: 'flat', notes: flats.sort(byLetter(FLAT_ORDER)) }
  return { accidental: 'none', notes: [] }
}

/**
 * The key built on `tonic`: its scale, key signature and seven diatonic triads.
 * `minor` is the natural minor (aeolian). Throws RangeError for an unknown mode or for a
 * tonic that is not one of the circle's spellings for that mode.
 */
export function getKey(tonic: string, mode: KeyMode): Key {
  const tonics = CIRCLE_TONICS[mode]
  if (tonics === undefined) throw new RangeError(`invalid mode "${mode}"`)
  if (!tonics.has(tonic)) throw new RangeError(`"${tonic}" is not a ${mode} key on the circle`)
  const scale = scaleOf(tonic, mode)
  return { tonic, mode, scale, signature: signatureOf(scale), chords: diatonicChords(scale) }
}
