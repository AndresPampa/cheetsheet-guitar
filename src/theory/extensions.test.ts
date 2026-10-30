import { describe, expect, it } from 'vitest'
import { getExtendedChord, getKey, type KeyMode } from './index.ts'

// ORACLE — every expected value below was written and verified by hand (stacked in thirds over
// the source scale, spelled by letter). NEVER regenerate these by calling tonal: that would be
// circular. Changing an expected value requires human (musical) approval.

type Base = 'triads' | 'sevenths'
type Ext = 9 | 11 | 13

const C_MAJOR = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** The six combinations of 0–2 extensions, in the column order of the spec tables. */
const COMBOS: Ext[][] = [[9], [11], [13], [9, 11], [9, 13], [11, 13]]

interface DegreeOracle {
  degree: number
  triad: string[]
  /** The diatonic 7th above the triad. */
  seventh: string
  /** 9th, 11th and 13th = the scale's 2nd, 4th and 6th degree above the root. */
  ext: Record<Ext, string>
  /** Symbols over the triad, one per COMBOS entry. */
  triadSymbols: string[]
  /** Symbols over the seventh chord, one per COMBOS entry. */
  seventhSymbols: string[]
}

const C_MAJOR_DEGREES: DegreeOracle[] = [
  {
    degree: 1,
    triad: ['C', 'E', 'G'],
    seventh: 'B',
    ext: { 9: 'D', 11: 'F', 13: 'A' },
    triadSymbols: ['Cadd9', 'Cadd11', 'C6', 'C(add9,11)', 'C6/9', 'C6(add11)'],
    seventhSymbols: ['Cmaj9', 'Cmaj7(11)', 'Cmaj7(13)', 'Cmaj11', 'Cmaj13', 'Cmaj7(11,13)'],
  },
  {
    degree: 2,
    triad: ['D', 'F', 'A'],
    seventh: 'C',
    ext: { 9: 'E', 11: 'G', 13: 'B' },
    triadSymbols: ['Dmadd9', 'Dmadd11', 'Dm6', 'Dm(add9,11)', 'Dm6/9', 'Dm6(add11)'],
    seventhSymbols: ['Dm9', 'Dm7(11)', 'Dm7(13)', 'Dm11', 'Dm13', 'Dm7(11,13)'],
  },
  {
    degree: 3,
    triad: ['E', 'G', 'B'],
    seventh: 'D',
    ext: { 9: 'F', 11: 'A', 13: 'C' },
    triadSymbols: [
      'Em(addb9)',
      'Emadd11',
      'Em(addb13)',
      'Em(addb9,11)',
      'Em(addb9,b13)',
      'Em(add11,b13)',
    ],
    seventhSymbols: ['Em7(b9)', 'Em7(11)', 'Em7(b13)', 'Em7(b9,11)', 'Em7(b9,b13)', 'Em7(11,b13)'],
  },
  {
    degree: 4,
    triad: ['F', 'A', 'C'],
    seventh: 'E',
    ext: { 9: 'G', 11: 'B', 13: 'D' },
    triadSymbols: ['Fadd9', 'F(add#11)', 'F6', 'F(add9,#11)', 'F6/9', 'F6(add#11)'],
    seventhSymbols: ['Fmaj9', 'Fmaj7(#11)', 'Fmaj7(13)', 'Fmaj9(#11)', 'Fmaj13', 'Fmaj7(#11,13)'],
  },
  {
    degree: 5,
    triad: ['G', 'B', 'D'],
    seventh: 'F',
    ext: { 9: 'A', 11: 'C', 13: 'E' },
    triadSymbols: ['Gadd9', 'Gadd11', 'G6', 'G(add9,11)', 'G6/9', 'G6(add11)'],
    seventhSymbols: ['G9', 'G7(11)', 'G7(13)', 'G11', 'G13', 'G7(11,13)'],
  },
  {
    degree: 6,
    triad: ['A', 'C', 'E'],
    seventh: 'G',
    ext: { 9: 'B', 11: 'D', 13: 'F' },
    triadSymbols: [
      'Amadd9',
      'Amadd11',
      'Am(addb13)',
      'Am(add9,11)',
      'Am(add9,b13)',
      'Am(add11,b13)',
    ],
    seventhSymbols: ['Am9', 'Am7(11)', 'Am7(b13)', 'Am11', 'Am9(b13)', 'Am7(11,b13)'],
  },
  {
    degree: 7,
    triad: ['B', 'D', 'F'],
    seventh: 'A',
    ext: { 9: 'C', 11: 'E', 13: 'G' },
    triadSymbols: [
      'B°(addb9)',
      'B°(add11)',
      'B°(addb13)',
      'B°(addb9,11)',
      'B°(addb9,b13)',
      'B°(add11,b13)',
    ],
    seventhSymbols: [
      'Bm7b5(b9)',
      'Bm7b5(11)',
      'Bm7b5(b13)',
      'Bm7b5(b9,11)',
      'Bm7b5(b9,b13)',
      'Bm7b5(11,b13)',
    ],
  },
]

type Case = [label: string, degree: number, base: Base, extensions: Ext[], root: string]

/** Notes = base + the chosen extensions in 9 · 11 · 13 order (COMBOS is already in that order). */
const NOTE_CASES: Array<[...Case, notes: string[]]> = C_MAJOR_DEGREES.flatMap((d) =>
  (['triads', 'sevenths'] as const).flatMap((base) =>
    COMBOS.map((exts): [...Case, string[]] => [
      `degree ${d.degree} ${base} [${exts.join(',')}]`,
      d.degree,
      base,
      exts,
      d.triad[0]!,
      [...d.triad, ...(base === 'sevenths' ? [d.seventh] : []), ...exts.map((e) => d.ext[e])],
    ]),
  ),
)

/** The spec's suffix rule: the symbol without its root, with `6/9` written `69`. */
const symbolCases = (base: Base): Array<[...Case, symbol: string, suffix: string]> =>
  C_MAJOR_DEGREES.flatMap((d) =>
    COMBOS.map((exts, i): [...Case, string, string] => {
      const symbol = (base === 'triads' ? d.triadSymbols : d.seventhSymbols)[i]!
      const root = d.triad[0]!
      return [
        `degree ${d.degree} [${exts.join(',')}]`,
        d.degree,
        base,
        exts,
        root,
        symbol,
        symbol.slice(root.length).replace('6/9', '69'),
      ]
    }),
  )
const TRIAD_SYMBOL_CASES = symbolCases('triads')
const SEVENTH_SYMBOL_CASES = symbolCases('sevenths')

describe('getExtendedChord in C major', () => {
  it.each(NOTE_CASES)('stacks the notes of %s', (_, degree, base, exts, root, notes) => {
    const chord = getExtendedChord(C_MAJOR, degree, base, exts)

    expect(chord.root).toBe(root)
    expect(chord.notes).toEqual(notes)
  })

  it('stacks the chosen extensions in 9 · 11 · 13 order', () => {
    expect(getExtendedChord(C_MAJOR, 6, 'sevenths', [13, 9]).notes).toEqual([
      'A',
      'C',
      'E',
      'G',
      'B',
      'F',
    ])
  })

  it.each(TRIAD_SYMBOL_CASES)(
    'names the triad on %s',
    (_, degree, base, exts, root, symbol, suffix) => {
      const chord = getExtendedChord(C_MAJOR, degree, base, exts)

      expect(chord).toMatchObject({ root, symbol, suffix })
    },
  )

  it.each(SEVENTH_SYMBOL_CASES)(
    'names the seventh chord on %s',
    (_, degree, base, exts, root, symbol, suffix) => {
      const chord = getExtendedChord(C_MAJOR, degree, base, exts)

      expect(chord).toMatchObject({ root, symbol, suffix })
    },
  )
})

describe('getExtendedChord spelling', () => {
  const GB_LOCRIAN = ['Gb', 'Abb', 'Bbb', 'Cb', 'Dbb', 'Ebb', 'Fb']
  const GB_LOCRIAN_CASES: Array<[string, number, Base, Ext[], Record<string, unknown>]> = [
    [
      'Gbm7b5(b9,b13)',
      1,
      'sevenths',
      [9, 13],
      {
        root: 'Gb',
        notes: ['Gb', 'Bbb', 'Dbb', 'Fb', 'Abb', 'Ebb'],
        suffix: 'm7b5(b9,b13)',
        symbol: 'Gbm7b5(b9,b13)',
      },
    ],
    [
      'Abbmaj9',
      2,
      'sevenths',
      [9],
      {
        root: 'Abb',
        notes: ['Abb', 'Cb', 'Ebb', 'Gb', 'Bbb'],
        suffix: 'maj9',
        symbol: 'Abbmaj9',
      },
    ],
    [
      'Gb°(add11)',
      1,
      'triads',
      [11],
      { root: 'Gb', notes: ['Gb', 'Bbb', 'Dbb', 'Cb'], suffix: '°(add11)', symbol: 'Gb°(add11)' },
    ],
  ]

  it.each(GB_LOCRIAN_CASES)(
    'keeps the double flats of Gb locrian in %s',
    (_, degree, base, exts, expected) => {
      expect(getExtendedChord(GB_LOCRIAN, degree, base, exts)).toEqual(expected)
    },
  )
})

// Every key the circle can select, written by hand.
const MAJOR_TONICS = [
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
]
const MINOR_TONICS = [
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
]
const CIRCLE_KEYS: Array<[string, KeyMode]> = [
  ...MAJOR_TONICS.map((tonic): [string, KeyMode] => [tonic, 'major']),
  ...MINOR_TONICS.map((tonic): [string, KeyMode] => [tonic, 'minor']),
]

describe('getExtendedChord without extensions', () => {
  it.each(CIRCLE_KEYS)('%s %s: gives the diatonic triads and sevenths of getKey', (tonic, mode) => {
    const key = getKey(tonic, mode)

    for (const chord of key.chords) {
      const triad = getExtendedChord(key.scale, chord.degree, 'triads', [])
      const seventh = getExtendedChord(key.scale, chord.degree, 'sevenths', [])

      expect(triad).toMatchObject({ root: chord.root, notes: chord.notes, symbol: chord.symbol })
      expect(seventh).toMatchObject({
        root: chord.root,
        notes: chord.seventh.notes,
        symbol: chord.seventh.symbol,
      })
    }
  })
})

describe('getExtendedChord extension order', () => {
  it('gives the same chord for [13, 9] as for [9, 13]', () => {
    const g13 = { root: 'G', notes: ['G', 'B', 'D', 'F', 'A', 'E'], suffix: '13', symbol: 'G13' }

    expect(getExtendedChord(C_MAJOR, 5, 'sevenths', [13, 9])).toEqual(g13)
    expect(getExtendedChord(C_MAJOR, 5, 'sevenths', [9, 13])).toEqual(g13)
  })
})

// ORACLE — hand-written (specs/chord-extensions, "Cifrado sobre C menor armónica"): the new
// qualities of the harmonic minor. mMaj7 stacks like maj7 on a natural 9; maj7#5 and °7 always
// take parentheses; the augmented triad always takes `+(add…)`, never `+6`.
const C_HARMONIC_MINOR = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B']

const HARMONIC_SYMBOL_CASES: Array<
  [symbol: string, degree: number, base: Base, extensions: Ext[], root: string, suffix: string]
> = [
  ['CmMaj9', 1, 'sevenths', [9], 'C', 'mMaj9'],
  ['CmMaj11', 1, 'sevenths', [9, 11], 'C', 'mMaj11'],
  ['CmMaj9(b13)', 1, 'sevenths', [9, 13], 'C', 'mMaj9(b13)'],
  ['CmMaj7(11)', 1, 'sevenths', [11], 'C', 'mMaj7(11)'],
  ['Eb+', 3, 'triads', [], 'Eb', '+'],
  ['Eb+(add9)', 3, 'triads', [9], 'Eb', '+(add9)'],
  ['Eb+(add13)', 3, 'triads', [13], 'Eb', '+(add13)'],
  ['Ebmaj7#5(9)', 3, 'sevenths', [9], 'Eb', 'maj7#5(9)'],
  ['Ebmaj7#5(9,11)', 3, 'sevenths', [9, 11], 'Eb', 'maj7#5(9,11)'],
  ['B°7', 7, 'sevenths', [], 'B', '°7'],
  ['B°7(b9)', 7, 'sevenths', [9], 'B', '°7(b9)'],
  ['B°7(b11,b13)', 7, 'sevenths', [11, 13], 'B', '°7(b11,b13)'],
]

describe('getExtendedChord in C harmonic minor', () => {
  it.each(HARMONIC_SYMBOL_CASES)('names %s', (symbol, degree, base, exts, root, suffix) => {
    const chord = getExtendedChord(C_HARMONIC_MINOR, degree, base, exts)

    expect(chord).toMatchObject({ root, symbol, suffix })
  })
})

describe('getExtendedChord invalid input', () => {
  const INVALID: Array<[string, number, Ext[]]> = [
    ['three extensions', 1, [9, 11, 13]],
    ['a repeated extension', 1, [9, 9]],
    ['degree 0', 0, [9]],
    ['degree 8', 8, [9]],
  ]

  it.each(INVALID)('rejects %s', (_, degree, exts) => {
    expect(() => getExtendedChord(C_MAJOR, degree, 'sevenths', exts)).toThrow(RangeError)
  })
})
