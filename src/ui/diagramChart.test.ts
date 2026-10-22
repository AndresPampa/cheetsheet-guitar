import { describe, expect, it } from 'vitest'
import { toChart } from './diagramChart.ts'

// Expected charts reasoned by hand from svguitar's model: strings 6 (low E) … 1 (high E), frets
// relative to `position`, a barre spans from its lowest string (higher number) to its highest.
describe('toChart', () => {
  it('maps open and muted strings and finger labels (open C)', () => {
    expect(
      toChart({ frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, barres: [] }),
    ).toEqual({
      fingers: [
        [6, 'x'],
        [5, 3, '3'],
        [4, 2, '2'],
        [3, 0],
        [2, 1, '1'],
        [1, 0],
      ],
      barres: [],
      position: 1,
    })
  })

  it('draws a full barre and only the fingers above it (F)', () => {
    expect(
      toChart({ frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] }),
    ).toEqual({
      fingers: [
        [5, 3, '3'],
        [4, 3, '4'],
        [3, 2, '2'],
      ],
      barres: [{ fret: 1, fromString: 6, toString: 1, text: '1' }],
      position: 1,
    })
  })

  it('uses frets relative to the starting fret (C barre at the 3rd fret)', () => {
    expect(
      toChart({ frets: [3, 3, 5, 5, 5, 3], fingers: [1, 1, 2, 3, 4, 1], baseFret: 3, barres: [3] }),
    ).toEqual({
      fingers: [
        [4, 3, '2'],
        [3, 3, '3'],
        [2, 3, '4'],
      ],
      barres: [{ fret: 1, fromString: 6, toString: 1, text: '1' }],
      position: 3,
    })
  })

  it('draws two partial barres (Ebmaj7 x 1 1 3 3 3)', () => {
    expect(
      toChart({
        frets: [-1, 1, 1, 3, 3, 3],
        fingers: [0, 1, 1, 3, 3, 3],
        baseFret: 1,
        barres: [1, 3],
      }),
    ).toEqual({
      fingers: [[6, 'x']],
      barres: [
        { fret: 1, fromString: 5, toString: 4, text: '1' },
        { fret: 3, fromString: 3, toString: 1, text: '3' },
      ],
      position: 1,
    })
  })
})
