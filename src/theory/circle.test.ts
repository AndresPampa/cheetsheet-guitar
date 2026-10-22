import { describe, expect, it } from 'vitest'
import {
  CIRCLE_OF_FIFTHS,
  circleIndexOf,
  getCircleHighlights,
  getCircleSpelling,
  getKey,
} from './index.ts'

// ORACLE — written and verified by hand. Primary spelling = fewer accidentals;
// the F#/Gb tie goes to the sharp side (F# / D#m) so relative keys share a signature.

describe('CIRCLE_OF_FIFTHS', () => {
  it('lists the 12 major keys clockwise by fifths with their primary spelling', () => {
    expect(CIRCLE_OF_FIFTHS.map((p) => p.major.tonic)).toEqual([
      'C',
      'G',
      'D',
      'A',
      'E',
      'B',
      'F#',
      'Db',
      'Ab',
      'Eb',
      'Bb',
      'F',
    ])
  })

  it('pairs each position with its relative minor', () => {
    expect(CIRCLE_OF_FIFTHS.map((p) => p.minor.tonic)).toEqual([
      'A',
      'E',
      'B',
      'F#',
      'C#',
      'G#',
      'D#',
      'Bb',
      'F',
      'C',
      'G',
      'D',
    ])
  })

  it('offers the enharmonic alternate only at the three ambiguous positions', () => {
    const alternates = CIRCLE_OF_FIFTHS.map((p) => [p.major.alternate, p.minor.alternate])

    expect(alternates).toEqual([
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
      ['Cb', 'Ab'],
      ['Gb', 'Eb'],
      ['C#', 'A#'],
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
      [undefined, undefined],
    ])
  })

  it('numbers the positions 0 to 11', () => {
    expect(CIRCLE_OF_FIFTHS.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  // Hand-written: the vii° of each position's major key (its leading tone), under that key.
  it('lists the diminished chord of each major key on the innermost ring', () => {
    expect(CIRCLE_OF_FIFTHS.map((p) => [p.diminished.tonic, p.diminished.alternate])).toEqual([
      ['B', undefined],
      ['F#', undefined],
      ['C#', undefined],
      ['G#', undefined],
      ['D#', undefined],
      ['A#', 'Bb'],
      ['E#', 'F'],
      ['C', 'B#'],
      ['G', undefined],
      ['D', undefined],
      ['A', undefined],
      ['E', undefined],
    ])
  })
})

describe('circleIndexOf', () => {
  it.each([
    ['C', 'major', 0],
    ['F#', 'major', 6],
    ['Gb', 'major', 6],
    ['Cb', 'major', 5],
    ['C#', 'major', 7],
    ['F', 'major', 11],
    ['A', 'minor', 0],
    ['Eb', 'minor', 6],
    ['A#', 'minor', 7],
    ['Ab', 'minor', 5],
    ['D', 'minor', 11],
  ] as const)('places %s %s at position %i', (tonic, mode, index) => {
    expect(circleIndexOf(tonic, mode)).toBe(index)
  })

  it('rejects a tonic that is not a key on the circle', () => {
    expect(() => circleIndexOf('Fb', 'major')).toThrow(RangeError)
  })
})

describe('getCircleSpelling', () => {
  it.each([
    ['C', 'major', 0, undefined],
    ['F#', 'major', 6, 'Gb'],
    ['Gb', 'major', 6, 'F#'],
    ['Db', 'major', 7, 'C#'],
    ['C#', 'major', 7, 'Db'],
    ['B', 'major', 5, 'Cb'],
    ['Cb', 'major', 5, 'B'],
    ['D#', 'minor', 6, 'Eb'],
    ['Ab', 'minor', 5, 'G#'],
    ['E', 'minor', 1, undefined],
  ] as const)('places %s %s at %i with the other spelling %s', (tonic, mode, index, alternate) => {
    expect(getCircleSpelling(tonic, mode)).toEqual({ index, alternate })
  })

  it('rejects a tonic that is not a key on the circle', () => {
    expect(() => getCircleSpelling('Db', 'minor')).toThrow(RangeError)
  })
})

describe('getCircleHighlights', () => {
  it('places the seven diatonic chords of C major, B° on the diminished ring', () => {
    expect(getCircleHighlights(getKey('C', 'major'))).toEqual([
      { index: 0, ring: 'major', roman: 'I', symbol: 'C' },
      { index: 11, ring: 'minor', roman: 'ii', symbol: 'Dm' },
      { index: 1, ring: 'minor', roman: 'iii', symbol: 'Em' },
      { index: 11, ring: 'major', roman: 'IV', symbol: 'F' },
      { index: 1, ring: 'major', roman: 'V', symbol: 'G' },
      { index: 0, ring: 'minor', roman: 'vi', symbol: 'Am' },
      { index: 0, ring: 'diminished', roman: 'vii°', symbol: 'B°' },
    ])
  })

  it('uses the minor-key numerals for A minor', () => {
    expect(getCircleHighlights(getKey('A', 'minor'))).toEqual([
      { index: 0, ring: 'minor', roman: 'i', symbol: 'Am' },
      { index: 0, ring: 'diminished', roman: 'ii°', symbol: 'B°' },
      { index: 0, ring: 'major', roman: 'III', symbol: 'C' },
      { index: 11, ring: 'minor', roman: 'iv', symbol: 'Dm' },
      { index: 1, ring: 'minor', roman: 'v', symbol: 'Em' },
      { index: 11, ring: 'major', roman: 'VI', symbol: 'F' },
      { index: 1, ring: 'major', roman: 'VII', symbol: 'G' },
    ])
  })

  it('finds enharmonically spelled chords (Gb major: Cb on the B/Cb sector)', () => {
    expect(getCircleHighlights(getKey('Gb', 'major'))).toEqual([
      { index: 6, ring: 'major', roman: 'I', symbol: 'Gb' },
      { index: 5, ring: 'minor', roman: 'ii', symbol: 'Abm' },
      { index: 7, ring: 'minor', roman: 'iii', symbol: 'Bbm' },
      { index: 5, ring: 'major', roman: 'IV', symbol: 'Cb' },
      { index: 7, ring: 'major', roman: 'V', symbol: 'Db' },
      { index: 6, ring: 'minor', roman: 'vi', symbol: 'Ebm' },
      { index: 6, ring: 'diminished', roman: 'vii°', symbol: 'F°' },
    ])
  })

  it('clusters around its own position (Db major: Ebm on the D#m/Ebm sector)', () => {
    expect(getCircleHighlights(getKey('Db', 'major')).map((h) => [h.index, h.ring])).toEqual([
      [7, 'major'],
      [6, 'minor'],
      [8, 'minor'],
      [6, 'major'],
      [8, 'major'],
      [7, 'minor'],
      [7, 'diminished'],
    ])
  })

  it('keeps the key spelling on ambiguous and flat-side sectors (C# major)', () => {
    expect(getCircleHighlights(getKey('C#', 'major'))).toEqual([
      { index: 7, ring: 'major', roman: 'I', symbol: 'C#' },
      { index: 6, ring: 'minor', roman: 'ii', symbol: 'D#m' },
      { index: 8, ring: 'minor', roman: 'iii', symbol: 'E#m' },
      { index: 6, ring: 'major', roman: 'IV', symbol: 'F#' },
      { index: 8, ring: 'major', roman: 'V', symbol: 'G#' },
      { index: 7, ring: 'minor', roman: 'vi', symbol: 'A#m' },
      { index: 7, ring: 'diminished', roman: 'vii°', symbol: 'B#°' },
    ])
  })

  it('wraps around the top of the circle (F major: Bb, F and C at 10, 11 and 0)', () => {
    expect(getCircleHighlights(getKey('F', 'major')).map((h) => [h.index, h.ring])).toEqual([
      [11, 'major'],
      [10, 'minor'],
      [0, 'minor'],
      [10, 'major'],
      [0, 'major'],
      [11, 'minor'],
      [11, 'diminished'],
    ])
  })
})
