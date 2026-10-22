import { describe, expect, it } from 'vitest'
import { getModesContaining, getParallelModes, type ModeName } from './index.ts'

// ORACLE — every expected value below was written and verified by hand.
// NEVER regenerate these by calling tonal: that would make the test circular.
// Changing an expected value requires human (musical) approval.

interface ModeOracleCase {
  name: ModeName
  scale: string[]
  symbols: string[]
  romans: string[]
  /** Note and interval above the root; null for ionian, the reference row. */
  characteristic: { note: string; interval: string } | null
  /** Triads that contain the characteristic note. */
  withCharacteristic: string[]
  stars: string[]
  /** Triads that differ from the ionian triad on the same degree. */
  borrowed: string[]
  seventhSymbols: string[]
  seventhRomans: string[]
}

const C_MODES: ModeOracleCase[] = [
  {
    name: 'ionian',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    symbols: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    characteristic: null,
    withCharacteristic: [],
    stars: [],
    borrowed: [],
    seventhSymbols: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
    seventhRomans: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
  },
  {
    name: 'dorian',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    symbols: ['Cm', 'Dm', 'Eb', 'F', 'Gm', 'A°', 'Bb'],
    romans: ['i', 'ii', 'bIII', 'IV', 'v', 'vi°', 'bVII'],
    characteristic: { note: 'A', interval: '6M' },
    withCharacteristic: ['Dm', 'F', 'A°'],
    stars: ['F'],
    borrowed: ['Cm', 'Eb', 'Gm', 'A°', 'Bb'],
    seventhSymbols: ['Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5', 'Bbmaj7'],
    seventhRomans: ['i7', 'ii7', 'bIIImaj7', 'IV7', 'v7', 'viø7', 'bVIImaj7'],
  },
  {
    name: 'phrygian',
    scale: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    symbols: ['Cm', 'Db', 'Eb', 'Fm', 'G°', 'Ab', 'Bbm'],
    romans: ['i', 'bII', 'bIII', 'iv', 'v°', 'bVI', 'bvii'],
    characteristic: { note: 'Db', interval: '2m' },
    withCharacteristic: ['Db', 'G°', 'Bbm'],
    stars: ['Db'],
    borrowed: ['Cm', 'Db', 'Eb', 'Fm', 'G°', 'Ab', 'Bbm'],
    seventhSymbols: ['Cm7', 'Dbmaj7', 'Eb7', 'Fm7', 'Gm7b5', 'Abmaj7', 'Bbm7'],
    seventhRomans: ['i7', 'bIImaj7', 'bIII7', 'iv7', 'vø7', 'bVImaj7', 'bvii7'],
  },
  {
    name: 'lydian',
    scale: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    symbols: ['C', 'D', 'Em', 'F#°', 'G', 'Am', 'Bm'],
    romans: ['I', 'II', 'iii', '#iv°', 'V', 'vi', 'vii'],
    characteristic: { note: 'F#', interval: '4A' },
    withCharacteristic: ['D', 'F#°', 'Bm'],
    stars: ['D'],
    borrowed: ['D', 'F#°', 'Bm'],
    seventhSymbols: ['Cmaj7', 'D7', 'Em7', 'F#m7b5', 'Gmaj7', 'Am7', 'Bm7'],
    seventhRomans: ['Imaj7', 'II7', 'iii7', '#ivø7', 'Vmaj7', 'vi7', 'vii7'],
  },
  {
    name: 'mixolydian',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    symbols: ['C', 'Dm', 'E°', 'F', 'Gm', 'Am', 'Bb'],
    romans: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', 'bVII'],
    characteristic: { note: 'Bb', interval: '7m' },
    withCharacteristic: ['E°', 'Gm', 'Bb'],
    stars: ['Bb'],
    borrowed: ['E°', 'Gm', 'Bb'],
    seventhSymbols: ['C7', 'Dm7', 'Em7b5', 'Fmaj7', 'Gm7', 'Am7', 'Bbmaj7'],
    seventhRomans: ['I7', 'ii7', 'iiiø7', 'IVmaj7', 'v7', 'vi7', 'bVIImaj7'],
  },
  {
    name: 'aeolian',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    symbols: ['Cm', 'D°', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
    romans: ['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII'],
    characteristic: { note: 'Ab', interval: '6m' },
    withCharacteristic: ['D°', 'Fm', 'Ab'],
    stars: ['Fm', 'Ab'],
    borrowed: ['Cm', 'D°', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
    seventhSymbols: ['Cm7', 'Dm7b5', 'Ebmaj7', 'Fm7', 'Gm7', 'Abmaj7', 'Bb7'],
    seventhRomans: ['i7', 'iiø7', 'bIIImaj7', 'iv7', 'v7', 'bVImaj7', 'bVII7'],
  },
  {
    name: 'locrian',
    scale: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    symbols: ['C°', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm'],
    romans: ['i°', 'bII', 'biii', 'iv', 'bV', 'bVI', 'bvii'],
    characteristic: { note: 'Gb', interval: '5d' },
    withCharacteristic: ['C°', 'Ebm', 'Gb'],
    stars: ['Gb'],
    borrowed: ['C°', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm'],
    seventhSymbols: ['Cm7b5', 'Dbmaj7', 'Ebm7', 'Fm7', 'Gbmaj7', 'Ab7', 'Bbm7'],
    seventhRomans: ['iø7', 'bIImaj7', 'biii7', 'iv7', 'bVmaj7', 'bVI7', 'bvii7'],
  },
]

const modeOf = (root: string, name: ModeName) => {
  const mode = getParallelModes(root).find((m) => m.name === name)
  if (mode === undefined) throw new Error(`no ${name} mode for ${root}`)
  return mode
}

describe('getParallelModes', () => {
  it('lists the seven modes in scale-degree order', () => {
    expect(getParallelModes('C').map((m) => m.name)).toEqual([
      'ionian',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'aeolian',
      'locrian',
    ])
  })

  describe.each(C_MODES)('C $name', (c) => {
    it('spells the scale from the root', () => {
      expect(modeOf('C', c.name).scale).toEqual(c.scale)
    })

    it('builds the seven triads', () => {
      expect(modeOf('C', c.name).chords.map((chord) => chord.symbol)).toEqual(c.symbols)
    })

    it('labels each triad with its degree altered against the major scale', () => {
      expect(modeOf('C', c.name).chords.map((chord) => chord.roman)).toEqual(c.romans)
    })

    it('names its characteristic note', () => {
      const characteristic = modeOf('C', c.name).characteristic

      expect(
        characteristic && { note: characteristic.note, interval: characteristic.interval },
      ).toEqual(c.characteristic)
    })

    it('flags the triads that contain the characteristic note', () => {
      const chords = modeOf('C', c.name).chords

      expect(
        chords.filter((chord) => chord.hasCharacteristic).map((chord) => chord.symbol),
      ).toEqual(c.withCharacteristic)
    })

    it('stars its most representative chords', () => {
      const chords = modeOf('C', c.name).chords

      expect(chords.filter((chord) => chord.star).map((chord) => chord.symbol)).toEqual(c.stars)
    })

    it('flags the triads borrowed from outside the ionian', () => {
      const chords = modeOf('C', c.name).chords

      expect(
        chords.filter((chord) => chord.differsFromIonian).map((chord) => chord.symbol),
      ).toEqual(c.borrowed)
    })

    it('builds the seven seventh chords with altered degrees', () => {
      const chords = modeOf('C', c.name).chords

      expect(chords.map((chord) => chord.seventh.symbol)).toEqual(c.seventhSymbols)
      expect(chords.map((chord) => chord.seventh.roman)).toEqual(c.seventhRomans)
    })
  })

  it('flags characteristic and borrowed chords separately for sevenths', () => {
    const chords = modeOf('C', 'mixolydian').chords

    expect(
      chords
        .filter((chord) => chord.seventh.hasCharacteristic)
        .map((chord) => chord.seventh.symbol),
    ).toEqual(['C7', 'Em7b5', 'Gm7', 'Bbmaj7'])
    // C7 differs from Cmaj7 even though the C triad is shared with ionian.
    expect(
      chords
        .filter((chord) => chord.seventh.differsFromIonian)
        .map((chord) => chord.seventh.symbol),
    ).toEqual(['C7', 'Em7b5', 'Gm7', 'Bbmaj7'])
    expect(chords[0]?.differsFromIonian).toBe(false)
  })

  // F7 (dorian) and Gmaj7 (lydian) are borrowed although their triads F and G are not.
  const SEVENTH_FLAGS: Array<[ModeName, string[], string[]]> = [
    ['dorian', ['Dm7', 'F7', 'Am7b5', 'Bbmaj7'], ['Cm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5', 'Bbmaj7']],
    ['lydian', ['D7', 'F#m7b5', 'Gmaj7', 'Bm7'], ['D7', 'F#m7b5', 'Gmaj7', 'Bm7']],
  ]

  it.each(SEVENTH_FLAGS)(
    'C %s flags characteristic and borrowed sevenths on their own',
    (name, withCharacteristic, borrowed) => {
      const chords = modeOf('C', name).chords

      expect(
        chords
          .filter((chord) => chord.seventh.hasCharacteristic)
          .map((chord) => chord.seventh.symbol),
      ).toEqual(withCharacteristic)
      expect(
        chords
          .filter((chord) => chord.seventh.differsFromIonian)
          .map((chord) => chord.seventh.symbol),
      ).toEqual(borrowed)
    },
  )

  it('keeps the root spelling and accepts double flats (Gb locrian)', () => {
    const mode = modeOf('Gb', 'locrian')

    expect(mode.scale).toEqual(['Gb', 'Abb', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb'])
    expect(mode.chords.map((chord) => chord.symbol)).toEqual([
      'Gb°',
      'Abb',
      'Bbbm',
      'Cbm',
      'Dbb',
      'Ebb',
      'Fbm',
    ])
    expect(mode.chords.map((chord) => chord.roman)).toEqual([
      'i°',
      'bII',
      'biii',
      'iv',
      'bV',
      'bVI',
      'bvii',
    ])
    expect(mode.characteristic?.note).toBe('Dbb')
  })

  it('keeps the root spelling and accepts double sharps (A# lydian)', () => {
    const mode = modeOf('A#', 'lydian')

    expect(mode.scale).toEqual(['A#', 'B#', 'C##', 'D##', 'E#', 'F##', 'G##'])
    expect(mode.chords.map((chord) => chord.symbol)).toEqual([
      'A#',
      'B#',
      'C##m',
      'D##°',
      'E#',
      'F##m',
      'G##m',
    ])
    expect(mode.chords.map((chord) => chord.roman)).toEqual([
      'I',
      'II',
      'iii',
      '#iv°',
      'V',
      'vi',
      'vii',
    ])
  })

  it.each(['', 'H', 'c', 'Fb', 'E#', 'B#', 'Cbb'])(
    'rejects the root "%s", which is not on the circle',
    (root) => {
      expect(() => getParallelModes(root)).toThrow(RangeError)
    },
  )
})

// Every root the circle can select (major and minor spellings), written by hand.
const CIRCLE_ROOTS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'D#',
  'A#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'Cb',
]

describe('getParallelModes invariants over every root on the circle', () => {
  it.each(CIRCLE_ROOTS)(
    '%s: every mode uses seven distinct letters starting on the root',
    (root) => {
      for (const mode of getParallelModes(root)) {
        expect(mode.scale[0]).toBe(root)
        expect(new Set(mode.scale.map((note) => note[0])).size).toBe(7)
      }
    },
  )

  it.each(CIRCLE_ROOTS)('%s: every mode has 3 major, 3 minor and 1 diminished triad', (root) => {
    for (const mode of getParallelModes(root)) {
      const qualities = mode.chords.map((chord) => chord.quality)

      expect(qualities.filter((q) => q === 'major')).toHaveLength(3)
      expect(qualities.filter((q) => q === 'minor')).toHaveLength(3)
      expect(qualities.filter((q) => q === 'diminished')).toHaveLength(1)
    }
  })

  it.each(CIRCLE_ROOTS)('%s: the characteristic note is in 3 triads and 4 sevenths', (root) => {
    for (const mode of getParallelModes(root).slice(1)) {
      expect(mode.chords.filter((chord) => chord.hasCharacteristic)).toHaveLength(3)
      expect(mode.chords.filter((chord) => chord.seventh.hasCharacteristic)).toHaveLength(4)
    }
  })

  it.each(CIRCLE_ROOTS)('%s: ionian is the reference, with nothing flagged', (root) => {
    const [ionian] = getParallelModes(root)

    expect(ionian?.characteristic).toBeNull()
    expect(ionian?.chords.some((c) => c.star || c.hasCharacteristic || c.differsFromIonian)).toBe(
      false,
    )
    expect(
      ionian?.chords.some((c) => c.seventh.hasCharacteristic || c.seventh.differsFromIonian),
    ).toBe(false)
  })

  it.each(CIRCLE_ROOTS)('%s: the stars land on curated degrees', (root) => {
    const starred = getParallelModes(root).map((mode) =>
      mode.chords.filter((chord) => chord.star).map((chord) => chord.degree),
    )

    expect(starred).toEqual([[], [4], [2], [2], [7], [4, 6], [5]])
  })
})

// ORACLE — hand-written: which parallel modes of C contain a chord, by its symbol.
const C_CONTAINING: Array<[string, Array<{ mode: ModeName; roman: string; star: boolean }>]> = [
  [
    'F',
    [
      { mode: 'ionian', roman: 'IV', star: false },
      { mode: 'dorian', roman: 'IV', star: true },
      { mode: 'mixolydian', roman: 'IV', star: false },
    ],
  ],
  [
    'Bb',
    [
      { mode: 'dorian', roman: 'bVII', star: false },
      { mode: 'mixolydian', roman: 'bVII', star: true },
      { mode: 'aeolian', roman: 'bVII', star: false },
    ],
  ],
  [
    'Fm',
    [
      { mode: 'phrygian', roman: 'iv', star: false },
      { mode: 'aeolian', roman: 'iv', star: true },
      { mode: 'locrian', roman: 'iv', star: false },
    ],
  ],
  [
    'Db',
    [
      { mode: 'phrygian', roman: 'bII', star: true },
      { mode: 'locrian', roman: 'bII', star: false },
    ],
  ],
  ['B°', [{ mode: 'ionian', roman: 'vii°', star: false }]],
  // Sevenths are matched by their own symbol: F7 lives only in dorian, Fmaj7 elsewhere.
  ['F7', [{ mode: 'dorian', roman: 'IV7', star: true }]],
  [
    'Cmaj7',
    [
      { mode: 'ionian', roman: 'Imaj7', star: false },
      { mode: 'lydian', roman: 'Imaj7', star: false },
    ],
  ],
  ['E', []],
]

describe('getModesContaining', () => {
  it.each(C_CONTAINING)('finds %s in the parallel modes of C', (symbol, expected) => {
    expect(getModesContaining('C', symbol)).toEqual(expected)
  })

  it('rejects a root that is not on the circle', () => {
    expect(() => getModesContaining('H', 'C')).toThrow(RangeError)
  })
})
