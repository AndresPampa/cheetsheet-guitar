import { describe, expect, it } from 'vitest'
import { getChordFormula } from './index.ts'

// ORACLE — every expected value below was written and verified by hand, against the major
// scale of the first note. NEVER regenerate these by calling tonal: that would be circular.
// Changing an expected value requires human (musical) approval.

describe('getChordFormula', () => {
  const triads: Array<[string, string[], string[]]> = [
    ['major', ['C', 'E', 'G'], ['1', '3', '5']],
    ['minor', ['C', 'Eb', 'G'], ['1', 'b3', '5']],
    ['diminished', ['B', 'D', 'F'], ['1', 'b3', 'b5']],
  ]

  it.each(triads)('names the degrees of a %s triad', (_, notes, formula) => {
    expect(getChordFormula(notes)).toEqual(formula)
  })

  const sevenths: Array<[string, string[], string[]]> = [
    ['major seventh', ['C', 'E', 'G', 'B'], ['1', '3', '5', '7']],
    ['dominant seventh', ['G', 'B', 'D', 'F'], ['1', '3', '5', 'b7']],
    ['minor seventh', ['D', 'F', 'A', 'C'], ['1', 'b3', '5', 'b7']],
    ['half-diminished seventh', ['B', 'D', 'F', 'A'], ['1', 'b3', 'b5', 'b7']],
  ]

  it.each(sevenths)('names the degrees of a %s chord', (_, notes, formula) => {
    expect(getChordFormula(notes)).toEqual(formula)
  })

  // The alteration is relative to the root's own major scale, not to the natural letters.
  const spellings: Array<[string, string[], string[]]> = [
    ['a sharp root (G# minor)', ['G#', 'B', 'D#'], ['1', 'b3', '5']],
    ['double flats (Gbm7)', ['Gb', 'Bbb', 'Db', 'Fb'], ['1', 'b3', '5', 'b7']],
    ['double sharps (E# major)', ['E#', 'G##', 'B#'], ['1', '3', '5']],
  ]

  it.each(spellings)('names the degrees of a chord spelled with %s', (_, notes, formula) => {
    expect(getChordFormula(notes)).toEqual(formula)
  })

  // In a chord stacked in thirds, degrees 2, 4 and 6 only appear as extensions: 9, 11, 13.
  const extensions: Array<[string, string[], string[]]> = [
    ['Cmaj13', ['C', 'E', 'G', 'B', 'D', 'A'], ['1', '3', '5', '7', '9', '13']],
    ['Em7(b9)', ['E', 'G', 'B', 'D', 'F'], ['1', 'b3', '5', 'b7', 'b9']],
    ['Fmaj7(#11)', ['F', 'A', 'C', 'E', 'B'], ['1', '3', '5', '7', '#11']],
    ['Am(addb13)', ['A', 'C', 'E', 'F'], ['1', 'b3', '5', 'b13']],
    [
      'Gbm7b5(b9,b13)',
      ['Gb', 'Bbb', 'Dbb', 'Fb', 'Abb', 'Ebb'],
      ['1', 'b3', 'b5', 'b7', 'b9', 'b13'],
    ],
  ]

  it.each(extensions)('names the extensions of %s as 9, 11 and 13', (_, notes, formula) => {
    expect(getChordFormula(notes)).toEqual(formula)
  })
})
