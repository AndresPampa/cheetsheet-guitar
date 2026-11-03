import { describe, expect, it } from 'vitest'
import { playbackPitches } from './index.ts'

// Expected octaves written by hand: the close voicing (root in octave 3, every next note strictly
// higher), then the root alone one octave down, as a clear bass.
describe('playbackPitches', () => {
  it.each([
    [
      ['C', 'E', 'G'],
      ['C2', 'E3', 'G3'],
    ],
    // Same pitch as the previous note (B#3 = C4, E3 = Fb3): one octave up, never a unison.
    [
      ['B#', 'C'],
      ['B#2', 'C5'],
    ],
    [
      ['E', 'Fb'],
      ['E2', 'Fb4'],
    ],
    [
      ['G', 'B', 'D'],
      ['G2', 'B3', 'D4'],
    ],
    [
      ['A', 'C', 'E', 'G'],
      ['A2', 'C4', 'E4', 'G4'],
    ],
    [
      ['B', 'D', 'F', 'A'],
      ['B2', 'D4', 'F4', 'A4'],
    ],
    [
      ['Cb', 'Eb', 'Gb'],
      ['Cb2', 'Eb3', 'Gb3'],
    ],
    [
      ['B#', 'D##', 'F##'],
      ['B#2', 'D##4', 'F##4'],
    ],
    [
      ['Abb', 'Cb', 'Ebb'],
      ['Abb2', 'Cb4', 'Ebb4'],
    ],
    // A triple flat (only Cb superlocrian bb7 has one) plays its pitch under a plain name:
    // Bbbb3 = Ab3 (MIDI 56), then Dbb4 = 60 and Fbb4 = 63; the root goes down to Ab2.
    [
      ['Bbbb', 'Dbb', 'Fbb'],
      ['Ab2', 'Dbb4', 'Fbb4'],
    ],
    // Spec chord-playback: Dm9 is Fmaj7 plus a root, and the bass now tells them apart.
    [
      ['D', 'F', 'A', 'C', 'E'],
      ['D2', 'F3', 'A3', 'C4', 'E4'],
    ],
    [
      ['F', 'A', 'C', 'E'],
      ['F2', 'A3', 'C4', 'E4'],
    ],
  ])('voices %j upwards from the root, the root an octave down, as %j', (notes, expected) => {
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
