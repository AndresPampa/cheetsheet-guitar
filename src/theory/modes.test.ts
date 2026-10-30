import { describe, expect, it } from 'vitest'
import {
  getModesContaining,
  getParallelModes,
  MODE_NAMES,
  PARENT_SCALES,
  parentScaleOf,
  type ModeName,
  type ParentScale,
} from './index.ts'

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

// ORACLE — hand-written: which parallel modes of C contain a chord, by its notes (the symbol
// is only the label). Characterization net: these outputs predate the notes-based lookup.
type Match = { mode: ModeName; roman: string; star: boolean }
const C_CONTAINING: Array<[string, string[], Match[]]> = [
  [
    'F',
    ['F', 'A', 'C'],
    [
      { mode: 'ionian', roman: 'IV', star: false },
      { mode: 'dorian', roman: 'IV', star: true },
      { mode: 'mixolydian', roman: 'IV', star: false },
    ],
  ],
  [
    'Bb',
    ['Bb', 'D', 'F'],
    [
      { mode: 'dorian', roman: 'bVII', star: false },
      { mode: 'mixolydian', roman: 'bVII', star: true },
      { mode: 'aeolian', roman: 'bVII', star: false },
    ],
  ],
  [
    'Fm',
    ['F', 'Ab', 'C'],
    [
      { mode: 'phrygian', roman: 'iv', star: false },
      { mode: 'aeolian', roman: 'iv', star: true },
      { mode: 'locrian', roman: 'iv', star: false },
    ],
  ],
  [
    'Db',
    ['Db', 'F', 'Ab'],
    [
      { mode: 'phrygian', roman: 'bII', star: true },
      { mode: 'locrian', roman: 'bII', star: false },
    ],
  ],
  ['B°', ['B', 'D', 'F'], [{ mode: 'ionian', roman: 'vii°', star: false }]],
  // A seventh is matched with its 7th: F A C Eb lives only in dorian, F A C E elsewhere.
  ['F7', ['F', 'A', 'C', 'Eb'], [{ mode: 'dorian', roman: 'IV7', star: true }]],
  [
    'Cmaj7',
    ['C', 'E', 'G', 'B'],
    [
      { mode: 'ionian', roman: 'Imaj7', star: false },
      { mode: 'lydian', roman: 'Imaj7', star: false },
    ],
  ],
  ['E', ['E', 'G#', 'B'], []],
]

// ORACLE — hand-written: extended chords among the parallel modes of C. The roman is the
// seventh's when the chord has the degree's 7th, the triad's otherwise.
const C_CONTAINING_EXTENDED: Array<[string, string[], Match[]]> = [
  ['Cmaj7(#11)', ['C', 'E', 'G', 'B', 'F#'], [{ mode: 'lydian', roman: 'Imaj7', star: false }]],
  ['Cmaj7(11)', ['C', 'E', 'G', 'B', 'F'], [{ mode: 'ionian', roman: 'Imaj7', star: false }]],
  [
    'Cadd11',
    ['C', 'E', 'G', 'F'],
    [
      { mode: 'ionian', roman: 'I', star: false },
      { mode: 'mixolydian', roman: 'I', star: false },
    ],
  ],
  [
    'Dm9',
    ['D', 'F', 'A', 'C', 'E'],
    [
      { mode: 'ionian', roman: 'ii7', star: false },
      { mode: 'mixolydian', roman: 'ii7', star: false },
    ],
  ],
]

describe('getModesContaining', () => {
  it.each(C_CONTAINING)('finds %s in the parallel modes of C', (_, notes, expected) => {
    expect(getModesContaining('C', notes)).toEqual(expected)
  })

  it.each(C_CONTAINING_EXTENDED)(
    'finds the extended chord %s in the parallel modes of C',
    (_, notes, expected) => {
      expect(getModesContaining('C', notes)).toEqual(expected)
    },
  )

  it('rejects a root that is not on the circle', () => {
    expect(() => getModesContaining('H', ['C', 'E', 'G'])).toThrow(RangeError)
  })
})

// ORACLE — hand-written (specs/chord-extensions, "E7 en La en todas las escalas" and "Acorde de
// calidad nueva"): the lookup across PARENT_SCALES, in parent-scale order (major, harmonic).
// The ionian never stars; harmonic minor stars its V.
const ACROSS_PARENT_SCALES: Array<[string, string, string[], Match[]]> = [
  [
    'E7 in A',
    'A',
    ['E', 'G#', 'B', 'D'],
    [
      { mode: 'ionian', roman: 'V7', star: false },
      { mode: 'harmonic-minor', roman: 'V7', star: true },
    ],
  ],
  [
    'CmMaj7 in C',
    'C',
    ['C', 'Eb', 'G', 'B'],
    [{ mode: 'harmonic-minor', roman: 'i(maj7)', star: false }],
  ],
]

describe('getModesContaining across parent scales', () => {
  it.each(ACROSS_PARENT_SCALES)(
    'finds %s in every parent scale, major first',
    (_, root, notes, expected) => {
      expect(getModesContaining(root, notes, PARENT_SCALES)).toEqual(expected)
    },
  )

  it('finds no CmMaj7 in C when only the default major parent scale is searched', () => {
    expect(getModesContaining('C', ['C', 'Eb', 'G', 'B'])).toEqual([])
  })
})

// ORACLE — harmonic minor as parent scale (v2.0), copied verbatim from the hand-verified tables
// of openspec/changes/establish-parent-scales/specs/parent-scales/spec.md. NEVER regenerate
// them with tonal (circular). Changing an expected value requires human (musical) approval.

interface HarmonicOracleCase {
  name: ModeName
  scale: string[]
  characteristic: { note: string; interval: string }
  /** Starred degrees. */
  stars: number[]
  symbols: string[]
  romans: string[]
  seventhSymbols: string[]
}

const C_HARMONIC_MODES: HarmonicOracleCase[] = [
  {
    name: 'harmonic-minor',
    scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
    characteristic: { note: 'B', interval: '7M' },
    stars: [5],
    symbols: ['Cm', 'D°', 'Eb+', 'Fm', 'G', 'Ab', 'B°'],
    romans: ['i', 'ii°', 'bIII+', 'iv', 'V', 'bVI', 'vii°'],
    seventhSymbols: ['CmMaj7', 'Dm7b5', 'Ebmaj7#5', 'Fm7', 'G7', 'Abmaj7', 'B°7'],
  },
  {
    name: 'locrian-nat6',
    scale: ['C', 'Db', 'Eb', 'F', 'Gb', 'A', 'Bb'],
    characteristic: { note: 'A', interval: '6M' },
    stars: [4],
    symbols: ['C°', 'Db+', 'Ebm', 'F', 'Gb', 'A°', 'Bbm'],
    romans: ['i°', 'bII+', 'biii', 'IV', 'bV', 'vi°', 'bvii'],
    seventhSymbols: ['Cm7b5', 'Dbmaj7#5', 'Ebm7', 'F7', 'Gbmaj7', 'A°7', 'BbmMaj7'],
  },
  {
    name: 'ionian-sharp5',
    scale: ['C', 'D', 'E', 'F', 'G#', 'A', 'B'],
    characteristic: { note: 'G#', interval: '5A' },
    stars: [1],
    symbols: ['C+', 'Dm', 'E', 'F', 'G#°', 'Am', 'B°'],
    romans: ['I+', 'ii', 'III', 'IV', '#v°', 'vi', 'vii°'],
    seventhSymbols: ['Cmaj7#5', 'Dm7', 'E7', 'Fmaj7', 'G#°7', 'AmMaj7', 'Bm7b5'],
  },
  {
    name: 'dorian-sharp4',
    scale: ['C', 'D', 'Eb', 'F#', 'G', 'A', 'Bb'],
    characteristic: { note: 'F#', interval: '4A' },
    stars: [2],
    symbols: ['Cm', 'D', 'Eb', 'F#°', 'Gm', 'A°', 'Bb+'],
    romans: ['i', 'II', 'bIII', '#iv°', 'v', 'vi°', 'bVII+'],
    seventhSymbols: ['Cm7', 'D7', 'Ebmaj7', 'F#°7', 'GmMaj7', 'Am7b5', 'Bbmaj7#5'],
  },
  {
    name: 'phrygian-dominant',
    scale: ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb'],
    characteristic: { note: 'E', interval: '3M' },
    stars: [1],
    symbols: ['C', 'Db', 'E°', 'Fm', 'G°', 'Ab+', 'Bbm'],
    romans: ['I', 'bII', 'iii°', 'iv', 'v°', 'bVI+', 'bvii'],
    seventhSymbols: ['C7', 'Dbmaj7', 'E°7', 'FmMaj7', 'Gm7b5', 'Abmaj7#5', 'Bbm7'],
  },
  {
    name: 'lydian-sharp2',
    scale: ['C', 'D#', 'E', 'F#', 'G', 'A', 'B'],
    characteristic: { note: 'D#', interval: '2A' },
    stars: [7],
    symbols: ['C', 'D#°', 'Em', 'F#°', 'G+', 'Am', 'B'],
    romans: ['I', '#ii°', 'iii', '#iv°', 'V+', 'vi', 'VII'],
    seventhSymbols: ['Cmaj7', 'D#°7', 'EmMaj7', 'F#m7b5', 'Gmaj7#5', 'Am7', 'B7'],
  },
  {
    name: 'superlocrian-bb7',
    scale: ['C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb'],
    characteristic: { note: 'Bbb', interval: '7d' },
    stars: [1],
    symbols: ['C°', 'Dbm', 'Eb°', 'Fb+', 'Gbm', 'Ab', 'Bbb'],
    romans: ['i°', 'bii', 'biii°', 'bIV+', 'bv', 'bVI', 'bbVII'],
    seventhSymbols: ['C°7', 'DbmMaj7', 'Ebm7b5', 'Fbmaj7#5', 'Gbm7', 'Ab7', 'Bbbmaj7'],
  },
]

type HarmonicOracleSubset = Pick<
  HarmonicOracleCase,
  'name' | 'scale' | 'characteristic' | 'seventhSymbols'
>

const A_HARMONIC_MODES: HarmonicOracleSubset[] = [
  {
    name: 'harmonic-minor',
    scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G#'],
    characteristic: { note: 'G#', interval: '7M' },
    seventhSymbols: ['AmMaj7', 'Bm7b5', 'Cmaj7#5', 'Dm7', 'E7', 'Fmaj7', 'G#°7'],
  },
  {
    name: 'locrian-nat6',
    scale: ['A', 'Bb', 'C', 'D', 'Eb', 'F#', 'G'],
    characteristic: { note: 'F#', interval: '6M' },
    seventhSymbols: ['Am7b5', 'Bbmaj7#5', 'Cm7', 'D7', 'Ebmaj7', 'F#°7', 'GmMaj7'],
  },
  {
    name: 'ionian-sharp5',
    scale: ['A', 'B', 'C#', 'D', 'E#', 'F#', 'G#'],
    characteristic: { note: 'E#', interval: '5A' },
    seventhSymbols: ['Amaj7#5', 'Bm7', 'C#7', 'Dmaj7', 'E#°7', 'F#mMaj7', 'G#m7b5'],
  },
  {
    name: 'dorian-sharp4',
    scale: ['A', 'B', 'C', 'D#', 'E', 'F#', 'G'],
    characteristic: { note: 'D#', interval: '4A' },
    seventhSymbols: ['Am7', 'B7', 'Cmaj7', 'D#°7', 'EmMaj7', 'F#m7b5', 'Gmaj7#5'],
  },
  {
    name: 'phrygian-dominant',
    scale: ['A', 'Bb', 'C#', 'D', 'E', 'F', 'G'],
    characteristic: { note: 'C#', interval: '3M' },
    seventhSymbols: ['A7', 'Bbmaj7', 'C#°7', 'DmMaj7', 'Em7b5', 'Fmaj7#5', 'Gm7'],
  },
  {
    name: 'lydian-sharp2',
    scale: ['A', 'B#', 'C#', 'D#', 'E', 'F#', 'G#'],
    characteristic: { note: 'B#', interval: '2A' },
    seventhSymbols: ['Amaj7', 'B#°7', 'C#mMaj7', 'D#m7b5', 'Emaj7#5', 'F#m7', 'G#7'],
  },
  {
    name: 'superlocrian-bb7',
    scale: ['A', 'Bb', 'C', 'Db', 'Eb', 'F', 'Gb'],
    characteristic: { note: 'Gb', interval: '7d' },
    seventhSymbols: ['A°7', 'BbmMaj7', 'Cm7b5', 'Dbmaj7#5', 'Ebm7', 'F7', 'Gbmaj7'],
  },
]

const harmonicModeOf = (root: string, name: ModeName) => {
  const mode = getParallelModes(root, 'harmonic').find((m) => m.name === name)
  if (mode === undefined) throw new Error(`no harmonic ${name} mode for ${root}`)
  return mode
}

describe('getParallelModes with the harmonic minor as parent scale', () => {
  it('lists the seven harmonic-minor modes in rotation order', () => {
    expect(getParallelModes('C', 'harmonic').map((m) => m.name)).toEqual([
      'harmonic-minor',
      'locrian-nat6',
      'ionian-sharp5',
      'dorian-sharp4',
      'phrygian-dominant',
      'lydian-sharp2',
      'superlocrian-bb7',
    ])
  })

  describe.each(C_HARMONIC_MODES)('C $name', (c) => {
    it('spells the scale from the root', () => {
      expect(harmonicModeOf('C', c.name).scale).toEqual(c.scale)
    })

    it('names its characteristic note and interval', () => {
      const characteristic = harmonicModeOf('C', c.name).characteristic

      expect(
        characteristic && { note: characteristic.note, interval: characteristic.interval },
      ).toEqual(c.characteristic)
    })

    it('stars its curated degree', () => {
      const chords = harmonicModeOf('C', c.name).chords

      expect(chords.filter((chord) => chord.star).map((chord) => chord.degree)).toEqual(c.stars)
    })

    it('builds the seven triads, including augmented ones', () => {
      expect(harmonicModeOf('C', c.name).chords.map((chord) => chord.symbol)).toEqual(c.symbols)
    })

    it('labels each triad with its degree altered against the major scale', () => {
      expect(harmonicModeOf('C', c.name).chords.map((chord) => chord.roman)).toEqual(c.romans)
    })

    it('builds the seven seventh chords, including mMaj7, maj7#5 and °7', () => {
      const chords = harmonicModeOf('C', c.name).chords

      expect(chords.map((chord) => chord.seventh.symbol)).toEqual(c.seventhSymbols)
    })
  })

  it('labels the C harmonic-minor sevenths with the new roman suffixes', () => {
    const chords = harmonicModeOf('C', 'harmonic-minor').chords

    expect(chords.map((chord) => chord.seventh.roman)).toEqual([
      'i(maj7)',
      'iiø7',
      'bIII+maj7',
      'iv7',
      'V7',
      'bVImaj7',
      'vii°7',
    ])
  })

  // Degree, triad quality, seventh quality.
  const HARMONIC_MINOR_QUALITIES: Array<[number, string, string]> = [
    [1, 'minor', 'mMaj7'],
    [3, 'augmented', 'maj7#5'],
    [7, 'diminished', 'dim7'],
  ]

  // Borrowed is measured against C major (C Dm Em F G Am B° / Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5),
  // never against the parent scale (design decision 27).
  it('flags the C harmonic-minor chords borrowed from outside the C major scale', () => {
    const chords = harmonicModeOf('C', 'harmonic-minor').chords

    expect(chords.filter((chord) => chord.differsFromIonian).map((chord) => chord.symbol)).toEqual([
      'Cm',
      'D°',
      'Eb+',
      'Fm',
      'Ab',
    ])
    expect(
      chords
        .filter((chord) => chord.seventh.differsFromIonian)
        .map((chord) => chord.seventh.symbol),
    ).toEqual(['CmMaj7', 'Dm7b5', 'Ebmaj7#5', 'Fm7', 'Abmaj7', 'B°7'])
  })

  it('flags the C harmonic-minor chords that contain its characteristic B', () => {
    const chords = harmonicModeOf('C', 'harmonic-minor').chords

    expect(chords.filter((chord) => chord.hasCharacteristic).map((chord) => chord.symbol)).toEqual([
      'Eb+',
      'G',
      'B°',
    ])
    expect(
      chords
        .filter((chord) => chord.seventh.hasCharacteristic)
        .map((chord) => chord.seventh.symbol),
    ).toEqual(['CmMaj7', 'Ebmaj7#5', 'G7', 'B°7'])
  })

  it.each(HARMONIC_MINOR_QUALITIES)(
    'C harmonic-minor degree %i is a %s triad and a %s seventh',
    (degree, triad, seventh) => {
      const chord = harmonicModeOf('C', 'harmonic-minor').chords[degree - 1]

      expect(chord?.quality).toBe(triad)
      expect(chord?.seventh.quality).toBe(seventh)
    },
  )

  it('labels the C superlocrian bb7 I and VII sevenths as i°7 and bbVIImaj7', () => {
    const chords = harmonicModeOf('C', 'superlocrian-bb7').chords

    expect(chords[0]?.seventh.roman).toBe('i°7')
    expect(chords[6]?.seventh.roman).toBe('bbVIImaj7')
  })

  describe.each(A_HARMONIC_MODES)('A $name', (a) => {
    it('spells the scale from the root', () => {
      expect(harmonicModeOf('A', a.name).scale).toEqual(a.scale)
    })

    it('names its characteristic note and interval', () => {
      const characteristic = harmonicModeOf('A', a.name).characteristic

      expect(
        characteristic && { note: characteristic.note, interval: characteristic.interval },
      ).toEqual(a.characteristic)
    })

    it('builds the seven seventh chords', () => {
      const chords = harmonicModeOf('A', a.name).chords

      expect(chords.map((chord) => chord.seventh.symbol)).toEqual(a.seventhSymbols)
    })
  })

  // Documented exception (design decision 5): the scale keeps the root spelling as given.
  it('spells Cb superlocrian bb7 with the one triple flat, Bbbb', () => {
    const mode = harmonicModeOf('Cb', 'superlocrian-bb7')

    expect(mode.scale).toEqual(['Cb', 'Dbb', 'Ebb', 'Fbb', 'Gbb', 'Abb', 'Bbbb'])
    expect(
      mode.characteristic && {
        note: mode.characteristic.note,
        interval: mode.characteristic.interval,
      },
    ).toEqual({ note: 'Bbbb', interval: '7d' })
    expect(mode.chords.map((chord) => chord.seventh.symbol)).toEqual([
      'Cb°7',
      'DbbmMaj7',
      'Ebbm7b5',
      'Fbbmaj7#5',
      'Gbbm7',
      'Abb7',
      'Bbbbmaj7',
    ])
  })

  it('spells Cb harmonic minor with double flats only', () => {
    expect(harmonicModeOf('Cb', 'harmonic-minor').scale).toEqual([
      'Cb',
      'Db',
      'Ebb',
      'Fb',
      'Gb',
      'Abb',
      'Bb',
    ])
  })

  it('has no triple accidental on any root of the circle except Cb superlocrian bb7', () => {
    const tripled = CIRCLE_ROOTS.flatMap((root) =>
      getParallelModes(root, 'harmonic')
        .filter((mode) => mode.scale.some((note) => /bbb|###/.test(note)))
        .map((mode) => `${root} ${mode.name}`),
    )

    expect(tripled).toEqual(['Cb superlocrian-bb7'])
  })
})

describe('getParallelModes with the major scale as parent', () => {
  // Characterization: the v1 suite above pins the default; 'major' must be the same thing.
  it.each(CIRCLE_ROOTS)('%s: passing major gives exactly the default result', (root) => {
    expect(getParallelModes(root, 'major')).toEqual(getParallelModes(root))
  })
})

const PARENT_SCALE_OF: Array<[ModeName, ParentScale]> = [
  ['ionian', 'major'],
  ['dorian', 'major'],
  ['phrygian', 'major'],
  ['lydian', 'major'],
  ['mixolydian', 'major'],
  ['aeolian', 'major'],
  ['locrian', 'major'],
  ['harmonic-minor', 'harmonic'],
  ['locrian-nat6', 'harmonic'],
  ['ionian-sharp5', 'harmonic'],
  ['dorian-sharp4', 'harmonic'],
  ['phrygian-dominant', 'harmonic'],
  ['lydian-sharp2', 'harmonic'],
  ['superlocrian-bb7', 'harmonic'],
]

describe('parent scales catalog', () => {
  it.each(PARENT_SCALE_OF)('the parent scale of %s is %s', (mode, parent) => {
    expect(parentScaleOf(mode)).toBe(parent)
  })

  it('lists the parent scales major then harmonic', () => {
    expect(PARENT_SCALES).toEqual(['major', 'harmonic'])
  })

  it('lists the 14 mode names of both parent scales', () => {
    expect(MODE_NAMES).toHaveLength(14)
    expect(MODE_NAMES).toEqual(expect.arrayContaining(PARENT_SCALE_OF.map(([mode]) => mode)))
  })
})
