import { describe, expect, it } from 'vitest'
import { getKey, type KeyMode, type SeventhQuality } from './index.ts'

// ORACLE — every expected value below was written and verified by hand.
// NEVER regenerate these by calling tonal: that would make the test circular.
// Changing an expected value requires human (musical) approval.

interface OracleCase {
  tonic: string
  mode: KeyMode
  scale: string[]
  symbols: string[]
  romans: string[]
  signature: { accidental: 'none' | 'sharp' | 'flat'; notes: string[] }
}

const ORACLE: OracleCase[] = [
  {
    tonic: 'C',
    mode: 'major',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    symbols: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'none', notes: [] },
  },
  {
    tonic: 'A',
    mode: 'minor',
    scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    symbols: ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'none', notes: [] },
  },
  {
    tonic: 'F',
    mode: 'major',
    scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    symbols: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'E°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'flat', notes: ['Bb'] },
  },
  {
    tonic: 'D',
    mode: 'major',
    scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    symbols: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#'] },
  },
  {
    tonic: 'E',
    mode: 'minor',
    scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    symbols: ['Em', 'F#°', 'G', 'Am', 'Bm', 'C', 'D'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'sharp', notes: ['F#'] },
  },
  {
    tonic: 'C',
    mode: 'minor',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    symbols: ['Cm', 'D°', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab'] },
  },
  // Enharmonic pair at the bottom of the circle: both spellings must be correct.
  {
    tonic: 'F#',
    mode: 'major',
    scale: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
    symbols: ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'] },
  },
  {
    tonic: 'Gb',
    mode: 'major',
    scale: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
    symbols: ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'F°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] },
  },
  {
    tonic: 'Eb',
    mode: 'minor',
    scale: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
    symbols: ['Ebm', 'F°', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] },
  },
  {
    tonic: 'D#',
    mode: 'minor',
    scale: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
    symbols: ['D#m', 'E#°', 'F#', 'G#m', 'A#m', 'B', 'C#'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'] },
  },
  // Enharmonic pairs C#/Db and B/Cb: the two 7-accidental keys pin the full signature order.
  {
    tonic: 'C#',
    mode: 'major',
    scale: ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
    symbols: ['C#', 'D#m', 'E#m', 'F#', 'G#', 'A#m', 'B#°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'] },
  },
  {
    tonic: 'Db',
    mode: 'major',
    scale: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
    symbols: ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'C°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
  },
  {
    tonic: 'B',
    mode: 'major',
    scale: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
    symbols: ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#'] },
  },
  {
    tonic: 'Cb',
    mode: 'major',
    scale: ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
    symbols: ['Cb', 'Dbm', 'Ebm', 'Fb', 'Gb', 'Abm', 'Bb°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    signature: { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'] },
  },
  {
    tonic: 'A#',
    mode: 'minor',
    scale: ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
    symbols: ['A#m', 'B#°', 'C#', 'D#m', 'E#m', 'F#', 'G#'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
    signature: { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'] },
  },
]

// ORACLE of diatonic seventh chords — hand-written and hand-verified, same rules as above.
interface SeventhOracleCase {
  tonic: string
  mode: KeyMode
  symbols: string[]
  romans: string[]
  qualities: SeventhQuality[]
}

const SEVENTH_ORACLE: SeventhOracleCase[] = [
  {
    tonic: 'C',
    mode: 'major',
    symbols: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
    romans: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
    qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
  },
  {
    tonic: 'A',
    mode: 'minor',
    symbols: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7'],
    romans: ['i7', 'iiø7', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7'],
    qualities: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
  },
  // Seven sharps: every chord carries an accidental, the seventh of G#7 is F#, B#m7b5 has A#.
  {
    tonic: 'C#',
    mode: 'major',
    symbols: ['C#maj7', 'D#m7', 'E#m7', 'F#maj7', 'G#7', 'A#m7', 'B#m7b5'],
    romans: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
    qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
  },
  // Six flats in minor: Cb as a chord root.
  {
    tonic: 'Eb',
    mode: 'minor',
    symbols: ['Ebm7', 'Fm7b5', 'Gbmaj7', 'Abm7', 'Bbm7', 'Cbmaj7', 'Db7'],
    romans: ['i7', 'iiø7', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7'],
    qualities: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'],
  },
]

describe('getKey seventh chords', () => {
  describe.each(SEVENTH_ORACLE)('$tonic $mode', (c) => {
    it('builds the seven diatonic seventh chords', () => {
      expect(getKey(c.tonic, c.mode).chords.map((chord) => chord.seventh.symbol)).toEqual(c.symbols)
    })

    it('labels each seventh chord with its roman-numeral degree', () => {
      expect(getKey(c.tonic, c.mode).chords.map((chord) => chord.seventh.roman)).toEqual(c.romans)
    })

    it('classifies each seventh chord by its intervals', () => {
      expect(getKey(c.tonic, c.mode).chords.map((chord) => chord.seventh.quality)).toEqual(
        c.qualities,
      )
    })
  })

  it('spells the sevenths of a seven-sharp key with the key signature', () => {
    const key = getKey('C#', 'major')

    expect(key.chords[4]?.seventh.notes).toEqual(['G#', 'B#', 'D#', 'F#'])
    expect(key.chords[6]?.seventh.notes).toEqual(['B#', 'D#', 'F#', 'A#'])
  })

  it('spells the sevenths of a six-flat key with Cb, never B', () => {
    const key = getKey('Eb', 'minor')

    expect(key.chords[1]?.seventh.notes).toEqual(['F', 'Ab', 'Cb', 'Eb'])
    expect(key.chords[6]?.seventh.notes).toEqual(['Db', 'F', 'Ab', 'Cb'])
  })
})

describe('getKey', () => {
  describe.each(ORACLE)('$tonic $mode', (c) => {
    it('spells the scale with one letter per degree', () => {
      expect(getKey(c.tonic, c.mode).scale).toEqual(c.scale)
    })

    it('builds the seven diatonic triads', () => {
      expect(getKey(c.tonic, c.mode).chords.map((chord) => chord.symbol)).toEqual(c.symbols)
    })

    it('labels each triad with its roman-numeral degree', () => {
      expect(getKey(c.tonic, c.mode).chords.map((chord) => chord.roman)).toEqual(c.romans)
    })

    it('reports the key signature in canonical order', () => {
      expect(getKey(c.tonic, c.mode).signature).toEqual(c.signature)
    })
  })

  it('describes each chord with its degree, root, quality and notes', () => {
    const key = getKey('C', 'major')

    expect(key.chords[4]).toEqual({
      degree: 5,
      roman: 'V',
      root: 'G',
      quality: 'major',
      symbol: 'G',
      notes: ['G', 'B', 'D'],
      seventh: { quality: '7', roman: 'V7', symbol: 'G7', notes: ['G', 'B', 'D', 'F'] },
    })
    expect(key.chords[6]).toEqual({
      degree: 7,
      roman: 'vii°',
      root: 'B',
      quality: 'diminished',
      symbol: 'B°',
      notes: ['B', 'D', 'F'],
      seventh: { quality: 'm7b5', roman: 'viiø7', symbol: 'Bm7b5', notes: ['B', 'D', 'F', 'A'] },
    })
  })

  it('echoes the requested tonic and mode', () => {
    const key = getKey('Bb', 'major')

    expect(key.tonic).toBe('Bb')
    expect(key.mode).toBe('major')
  })

  it.each(['', 'H', 'C##b', 'do', 'c', 'B##', 'Fbb'])('rejects the invalid tonic "%s"', (tonic) => {
    expect(() => getKey(tonic, 'major')).toThrow(RangeError)
  })

  // Theoretical keys (double accidentals in the signature) are not on the circle.
  it.each<[string, KeyMode]>([
    ['Fb', 'major'],
    ['E#', 'major'],
    ['B#', 'major'],
    ['G#', 'major'],
    ['D#', 'major'],
    ['Fb', 'minor'],
    ['Cb', 'minor'],
    ['Db', 'minor'],
    ['B#', 'minor'],
  ])('rejects %s %s, which is not on the circle', (tonic, mode) => {
    expect(() => getKey(tonic, mode)).toThrow(RangeError)
  })

  it('rejects an unknown mode coming from untyped input', () => {
    expect(() => getKey('C', 'dorian' as KeyMode)).toThrow(RangeError)
  })
})

// Property: across every key on the circle, the theory holds structurally.
// Accidental count per key (+ = sharps, - = flats), written by hand from the circle.
const CIRCLE_ACCIDENTALS: Record<KeyMode, Record<string, number>> = {
  major: {
    C: 0,
    G: 1,
    D: 2,
    A: 3,
    E: 4,
    B: 5,
    'F#': 6,
    'C#': 7,
    F: -1,
    Bb: -2,
    Eb: -3,
    Ab: -4,
    Db: -5,
    Gb: -6,
    Cb: -7,
  },
  minor: {
    A: 0,
    E: 1,
    B: 2,
    'F#': 3,
    'C#': 4,
    'G#': 5,
    'D#': 6,
    'A#': 7,
    D: -1,
    G: -2,
    C: -3,
    F: -4,
    Bb: -5,
    Eb: -6,
    Ab: -7,
  },
}

const CIRCLE_KEYS: Array<[string, KeyMode, number]> = (['major', 'minor'] as const).flatMap(
  (mode) =>
    Object.entries(CIRCLE_ACCIDENTALS[mode]).map(([tonic, count]): [string, KeyMode, number] => [
      tonic,
      mode,
      count,
    ]),
)

describe('getKey invariants over every key on the circle', () => {
  it.each(CIRCLE_KEYS)('%s %s uses seven distinct letters', (tonic, mode) => {
    const letters = getKey(tonic, mode).scale.map((note) => note[0])

    expect(new Set(letters).size).toBe(7)
  })

  it.each(CIRCLE_KEYS)('%s %s has 3 major, 3 minor and 1 diminished triad', (tonic, mode) => {
    const qualities = getKey(tonic, mode).chords.map((chord) => chord.quality)

    expect(qualities.filter((q) => q === 'major')).toHaveLength(3)
    expect(qualities.filter((q) => q === 'minor')).toHaveLength(3)
    expect(qualities.filter((q) => q === 'diminished')).toHaveLength(1)
  })

  it.each(CIRCLE_KEYS)('%s %s has %i accidentals (negative = flats)', (tonic, mode, count) => {
    const { signature } = getKey(tonic, mode)
    const signed =
      signature.accidental === 'flat' ? -signature.notes.length : signature.notes.length

    expect(signed).toBe(count)
  })

  it.each(CIRCLE_KEYS)('%s %s contains each triad inside its seventh chord', (tonic, mode) => {
    for (const chord of getKey(tonic, mode).chords) {
      expect(chord.seventh.notes).toHaveLength(4)
      expect(chord.seventh.notes.slice(0, 3)).toEqual(chord.notes)
    }
  })

  it.each(CIRCLE_KEYS)('%s %s has 2 maj7, 3 m7, 1 dominant 7 and 1 m7b5', (tonic, mode) => {
    const qualities = getKey(tonic, mode).chords.map((chord) => chord.seventh.quality)

    expect(qualities.filter((q) => q === 'maj7')).toHaveLength(2)
    expect(qualities.filter((q) => q === 'm7')).toHaveLength(3)
    expect(qualities.filter((q) => q === '7')).toHaveLength(1)
    expect(qualities.filter((q) => q === 'm7b5')).toHaveLength(1)
  })

  it.each(CIRCLE_KEYS)('%s %s lists every altered scale note in its signature', (tonic, mode) => {
    const key = getKey(tonic, mode)
    const altered = key.scale.filter((note) => note.length > 1)

    expect([...key.signature.notes].sort()).toEqual([...altered].sort())
  })
})
