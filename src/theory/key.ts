import { Interval, Key as TonalKey } from 'tonal'

export type KeyMode = 'major' | 'minor'
export type ChordQuality = 'major' | 'minor' | 'diminished'

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
/** Natural or single accidental: covers every spelling on the circle (F#/Gb, C#/Db, B/Cb). */
const VALID_TONIC = /^[A-G][#b]?$/

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

function diatonicTriads(scale: string[]): DiatonicChord[] {
  return scale.map((root, i) => {
    // Stacked thirds wrap around the 7-note scale, so the index is always in range.
    const third = scale[(i + 2) % 7]!
    const fifth = scale[(i + 4) % 7]!
    const quality = triadQuality(root, third, fifth)
    const degree = i + 1
    return {
      degree,
      roman: romanFor(degree, quality),
      root,
      quality,
      symbol: root + SYMBOL_SUFFIX[quality],
      notes: [root, third, fifth],
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
 * `minor` is the natural minor (aeolian). Throws RangeError for an unknown tonic.
 */
export function getKey(tonic: string, mode: KeyMode): Key {
  if (!VALID_TONIC.test(tonic)) throw new RangeError(`invalid tonic "${tonic}"`)
  const scale = scaleOf(tonic, mode)
  return { tonic, mode, scale, signature: signatureOf(scale), chords: diatonicTriads(scale) }
}
