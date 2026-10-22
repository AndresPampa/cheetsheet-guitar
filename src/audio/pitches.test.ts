import { describe, expect, it } from 'vitest'
import { playbackPitches } from './index.ts'

// Expected octaves written by hand: root in octave 3, every next note strictly higher.
describe('playbackPitches', () => {
  it.each([
    [
      ['C', 'E', 'G'],
      ['C3', 'E3', 'G3'],
    ],
    // Same pitch as the previous note (B#3 = C4, E3 = Fb3): one octave up, never a unison.
    [
      ['B#', 'C'],
      ['B#3', 'C5'],
    ],
    [
      ['E', 'Fb'],
      ['E3', 'Fb4'],
    ],
    [
      ['G', 'B', 'D'],
      ['G3', 'B3', 'D4'],
    ],
    [
      ['A', 'C', 'E', 'G'],
      ['A3', 'C4', 'E4', 'G4'],
    ],
    [
      ['B', 'D', 'F', 'A'],
      ['B3', 'D4', 'F4', 'A4'],
    ],
    [
      ['Cb', 'Eb', 'Gb'],
      ['Cb3', 'Eb3', 'Gb3'],
    ],
    [
      ['B#', 'D##', 'F##'],
      ['B#3', 'D##4', 'F##4'],
    ],
    [
      ['Abb', 'Cb', 'Ebb'],
      ['Abb3', 'Cb4', 'Ebb4'],
    ],
  ])('voices %j upwards from the root as %j', (notes, expected) => {
    expect(playbackPitches(notes)).toEqual(expected)
  })

  // Without the guard an unparseable name loops forever and freezes the tab.
  it.each(['H', 'C#b', ''])('rejects the unparseable note "%s"', (note) => {
    expect(() => playbackPitches(['C', note])).toThrow(RangeError)
  })

  it('returns nothing for an empty chord', () => {
    expect(playbackPitches([])).toEqual([])
  })
})
