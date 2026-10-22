import { describe, expect, it } from 'vitest'
import { loadVoicings, type Voicing, type VoicingQuality } from './index.ts'

// ORACLE — common guitar shapes, verified by hand (not read back from the data file).
// Frets are absolute, from the 6th (low E) to the 1st string; -1 = muted, 0 = open.
const SHAPES: Array<[string, VoicingQuality, number, Omit<Voicing, 'fingers'>]> = [
  ['C', 'major', 0, { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, barres: [] }],
  ['C', 'major', 1, { frets: [3, 3, 5, 5, 5, 3], baseFret: 3, barres: [3] }],
  ['C', 'major', 3, { frets: [8, 10, 10, 9, 8, 8], baseFret: 8, barres: [8] }],
  ['A', 'minor', 0, { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, barres: [] }],
  ['E', 'major', 0, { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, barres: [] }],
  ['F', 'major', 0, { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] }],
  ['G', '7', 0, { frets: [3, 2, 0, 0, 0, 1], baseFret: 1, barres: [] }],
  ['D', 'maj7', 0, { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1, barres: [2] }],
  ['B', 'm7b5', 0, { frets: [-1, 2, 3, 2, 3, -1], baseFret: 1, barres: [] }],
  ['C', 'diminished', 0, { frets: [-1, 3, 1, -1, 1, 2], baseFret: 1, barres: [] }],
]

describe('loadVoicings', () => {
  it.each(SHAPES)('%s %s position %i is the common shape', async (root, quality, i, shape) => {
    const voicings = await loadVoicings(root, quality)

    expect(voicings[i]).toMatchObject(shape)
  })

  it('gives the fingering of each string', async () => {
    const [open] = await loadVoicings('C', 'major')

    expect(open?.fingers).toEqual([0, 3, 2, 0, 1, 0])
  })

  it('offers several positions to choose from', async () => {
    expect(await loadVoicings('C', 'major')).toHaveLength(4)
  })

  // The data names 12 roots only; every other spelling is found by pitch.
  it.each<[string, VoicingQuality, number[]]>([
    ['Gb', 'major', [2, 4, 4, 3, 2, 2]],
    ['F#', 'major', [2, 4, 4, 3, 2, 2]],
    // B-major barre that also frets the 6th string (F# in the bass): F# B F# B D# F#.
    ['Cb', 'major', [2, 2, 4, 4, 4, 2]],
    ['B#', 'diminished', [-1, 3, 1, -1, 1, 2]],
    ['E#', 'major', [1, 3, 3, 2, 1, 1]],
    ['Abb', '7', [3, 2, 0, 0, 0, 1]],
  ])('finds %s %s by pitch', async (root, quality, frets) => {
    const [first] = await loadVoicings(root, quality)

    expect(first?.frets).toEqual(frets)
  })

  // Errata: the data's 2nd A° position (5 3 x 4 3 x) sounds A C B D, not A C Eb.
  it('leaves out the known-wrong A° position of the data', async () => {
    const voicings = await loadVoicings('A', 'diminished')

    expect(voicings).toHaveLength(3)
    expect(voicings.map((v) => v.frets)).not.toContainEqual([5, 3, -1, 4, 3, -1])
  })

  it('rejects a note name it cannot read', async () => {
    await expect(loadVoicings('H', 'major')).rejects.toThrow(RangeError)
  })
})

// Invariant over the whole catalogue: every voicing sounds only notes of its chord, with the
// root and the third present. Built from the standard tuning and hand-written chord formulas,
// never from tonal or from the data's own note list.
const TUNING = [4, 9, 2, 7, 11, 4] // E A D G B E as pitch classes
const FORMULAS: Record<VoicingQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
}
const ROOTS: Array<[string, number]> = [
  ['C', 0],
  ['C#', 1],
  ['D', 2],
  ['Eb', 3],
  ['E', 4],
  ['F', 5],
  ['F#', 6],
  ['G', 7],
  ['Ab', 8],
  ['A', 9],
  ['Bb', 10],
  ['B', 11],
]
const QUALITIES = Object.keys(FORMULAS) as VoicingQuality[]

describe('loadVoicings over the whole catalogue', () => {
  it('has at least one voicing for each of the 12 roots and 7 qualities', async () => {
    const missing: string[] = []
    for (const [root] of ROOTS) {
      for (const quality of QUALITIES) {
        if ((await loadVoicings(root, quality)).length === 0) missing.push(`${root} ${quality}`)
      }
    }

    expect(missing).toEqual([])
  })

  // Beyond root and third: a seventh chord must sound its 7th, a diminished one its b5.
  const REQUIRED: Record<VoicingQuality, number[]> = {
    major: [0, 4],
    minor: [0, 3],
    diminished: [0, 3, 6],
    maj7: [0, 4, 11],
    m7: [0, 3, 10],
    '7': [0, 4, 10],
    m7b5: [0, 3, 6, 10],
  }

  it.each(ROOTS)(
    '%s: every voicing sounds only its chord and its defining notes',
    async (root, pc) => {
      const wrong: string[] = []
      for (const quality of QUALITIES) {
        const allowed = FORMULAS[quality].map((interval) => (pc + interval) % 12)
        const required = REQUIRED[quality].map((interval) => (pc + interval) % 12)
        for (const voicing of await loadVoicings(root, quality)) {
          const sounding = voicing.frets.flatMap((fret, string) =>
            fret < 0 ? [] : [(TUNING[string]! + fret) % 12],
          )
          const fits =
            sounding.every((note) => allowed.includes(note)) &&
            required.every((note) => sounding.includes(note))
          if (!fits) wrong.push(`${root} ${quality} ${voicing.frets.join(' ')}`)
        }
      }

      expect(wrong).toEqual([])
    },
  )
})
