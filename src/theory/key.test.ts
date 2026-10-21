import { describe, expect, it } from 'vitest'
import { getKey, type KeyMode } from './index.ts'

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
]

describe('getKey', () => {
  describe.each(ORACLE)('$tonic $mode', (c) => {
    const key = getKey(c.tonic, c.mode)

    it('spells the scale with one letter per degree', () => {
      expect(key.scale).toEqual(c.scale)
    })

    it('builds the seven diatonic triads', () => {
      expect(key.chords.map((chord) => chord.symbol)).toEqual(c.symbols)
    })

    it('labels each triad with its roman-numeral degree', () => {
      expect(key.chords.map((chord) => chord.roman)).toEqual(c.romans)
    })

    it('reports the key signature in canonical order', () => {
      expect(key.signature).toEqual(c.signature)
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
    })
    expect(key.chords[6]).toEqual({
      degree: 7,
      roman: 'vii°',
      root: 'B',
      quality: 'diminished',
      symbol: 'B°',
      notes: ['B', 'D', 'F'],
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
})

// Property: across every key on the circle, the theory holds structurally.
const CIRCLE_KEYS: Array<[string, KeyMode]> = [
  ...['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'Db', 'C#', 'Ab', 'Eb', 'Bb', 'F', 'Cb'].map(
    (t): [string, KeyMode] => [t, 'major'],
  ),
  ...['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Eb', 'Bb', 'A#', 'F', 'C', 'G', 'D', 'Ab'].map(
    (t): [string, KeyMode] => [t, 'minor'],
  ),
]

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

  it.each(CIRCLE_KEYS)('%s %s only uses notes from its own scale', (tonic, mode) => {
    const key = getKey(tonic, mode)

    expect(key.chords).toHaveLength(7)
    for (const chord of key.chords) {
      for (const note of chord.notes) {
        expect(key.scale).toContain(note)
      }
    }
  })
})
