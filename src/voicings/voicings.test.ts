import { describe, expect, it } from 'vitest'
import { loadVoicings, type Voicing } from './index.ts'

/** What the loader is asked for: the chord's root, its chords-db-compatible suffix and notes. */
interface ChordQuery {
  root: string
  suffix: string
  notes: string[]
}

const chord = (root: string, suffix: string, notes: string[]): ChordQuery => ({
  root,
  suffix,
  notes,
})

// ORACLE — common guitar shapes, verified by hand (not read back from the data file).
// Frets are absolute, from the 6th (low E) to the 1st string; -1 = muted, 0 = open.
const SHAPES: Array<[string, number, ChordQuery, Omit<Voicing, 'fingers'>]> = [
  [
    'C major',
    0,
    chord('C', '', ['C', 'E', 'G']),
    { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, barres: [] },
  ],
  [
    'C major',
    1,
    chord('C', '', ['C', 'E', 'G']),
    { frets: [3, 3, 5, 5, 5, 3], baseFret: 3, barres: [3] },
  ],
  [
    'C major',
    3,
    chord('C', '', ['C', 'E', 'G']),
    { frets: [8, 10, 10, 9, 8, 8], baseFret: 8, barres: [8] },
  ],
  [
    'A minor',
    0,
    chord('A', 'm', ['A', 'C', 'E']),
    { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, barres: [] },
  ],
  [
    'E major',
    0,
    chord('E', '', ['E', 'G#', 'B']),
    { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, barres: [] },
  ],
  [
    'F major',
    0,
    chord('F', '', ['F', 'A', 'C']),
    { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  ],
  [
    'G 7',
    0,
    chord('G', '7', ['G', 'B', 'D', 'F']),
    { frets: [3, 2, 0, 0, 0, 1], baseFret: 1, barres: [] },
  ],
  [
    'D maj7',
    0,
    chord('D', 'maj7', ['D', 'F#', 'A', 'C#']),
    { frets: [-1, -1, 0, 2, 2, 2], baseFret: 1, barres: [2] },
  ],
  [
    'B m7b5',
    0,
    chord('B', 'm7b5', ['B', 'D', 'F', 'A']),
    { frets: [-1, 2, 3, 2, 3, -1], baseFret: 1, barres: [] },
  ],
  [
    'C diminished',
    0,
    chord('C', '°', ['C', 'Eb', 'Gb']),
    { frets: [-1, 3, 1, -1, 1, 2], baseFret: 1, barres: [] },
  ],
]

const C_MAJOR = chord('C', '', ['C', 'E', 'G'])

// The data names 12 roots only; every other spelling is found by pitch.
const BY_PITCH: Array<[string, ChordQuery, number[]]> = [
  ['Gb major', chord('Gb', '', ['Gb', 'Bb', 'Db']), [2, 4, 4, 3, 2, 2]],
  ['F# major', chord('F#', '', ['F#', 'A#', 'C#']), [2, 4, 4, 3, 2, 2]],
  // B-major barre that also frets the 6th string (F# in the bass): F# B F# B D# F#.
  ['Cb major', chord('Cb', '', ['Cb', 'Eb', 'Gb']), [2, 2, 4, 4, 4, 2]],
  ['B# diminished', chord('B#', '°', ['B#', 'D#', 'F#']), [-1, 3, 1, -1, 1, 2]],
  ['E# major', chord('E#', '', ['E#', 'G##', 'B#']), [1, 3, 3, 2, 1, 1]],
  ['Abb 7', chord('Abb', '7', ['Abb', 'Cb', 'Ebb', 'Gbb']), [3, 2, 0, 0, 0, 1]],
]

describe('loadVoicings', () => {
  it.each(SHAPES)('%s position %i is the common shape', async (_, i, query, shape) => {
    const voicings = await loadVoicings(query)

    expect(voicings[i]).toMatchObject(shape)
  })

  it('gives the fingering of each string', async () => {
    const [open] = await loadVoicings(C_MAJOR)

    expect(open?.fingers).toEqual([0, 3, 2, 0, 1, 0])
  })

  it('offers several positions to choose from', async () => {
    expect(await loadVoicings(C_MAJOR)).toHaveLength(4)
  })

  it.each(BY_PITCH)('finds %s by pitch', async (_, query, frets) => {
    const [first] = await loadVoicings(query)

    expect(first?.frets).toEqual(frets)
  })

  // Errata: the data's 2nd A° position (5 3 x 4 3 x) sounds A C B D, not A C Eb.
  it('leaves out the known-wrong A° position of the data', async () => {
    const voicings = await loadVoicings(chord('A', '°', ['A', 'C', 'Eb']))

    expect(voicings).toHaveLength(3)
    expect(voicings.map((v) => v.frets)).not.toContainEqual([5, 3, -1, 4, 3, -1])
  })

  it('rejects a note name it cannot read', async () => {
    await expect(loadVoicings(chord('H', '', ['H', 'D#', 'F#']))).rejects.toThrow(RangeError)
  })

  // ORACLE — 8 7 7 7 8 6 sounds C E A D G Bb, verified by hand. The data's other three C13
  // positions have no 9th (D), so they do not sound the chord asked for.
  it('keeps only the positions that sound every note of an extended chord', async () => {
    const voicings = await loadVoicings(chord('C', '13', ['C', 'E', 'G', 'Bb', 'D', 'A']))

    expect(voicings.map((v) => v.frets)).toEqual([[8, 7, 7, 7, 8, 6]])
  })

  const NO_ENTRY: Array<[string, ChordQuery]> = [
    ['Cmaj7(#11)', chord('C', 'maj7(#11)', ['C', 'E', 'G', 'B', 'F#'])],
    ['Dm13', chord('D', 'm13', ['D', 'F', 'A', 'C', 'E', 'B'])],
    ['Bm7b5(b9)', chord('B', 'm7b5(b9)', ['B', 'D', 'F', 'A', 'C'])],
    ['Ebmaj7#5(9)', chord('Eb', 'maj7#5(9)', ['Eb', 'G', 'B', 'D', 'F'])],
  ]

  it.each(NO_ENTRY)('gives no voicings for %s, a suffix the data lacks', async (_, query) => {
    expect(await loadVoicings(query)).toEqual([])
  })

  // ORACLE — the parent-scale suffixes, each looked up under the data's own name (+ → aug,
  // °7 → dim7, mMaj7 → mmaj7, mMaj9 → mmaj9, mMaj11 → mmaj11; maj7#5 as it is). Frets verified
  // by hand from the standard tuning, from the 6th string to the 1st:
  //   C+       x 3 2 1 1 x  →  C E G# C
  //   C°7      x x 1 2 1 2  →  Eb A(Bbb) C Gb
  //   CmMaj7   x 3 1 0 0 x  →  C Eb G B
  //   Cmaj7#5  x 3 2 1 0 0  →  C E G# B E
  //   CmMaj9   x 3 1 4 3 x  →  C Eb B D (no fifth)
  const PARENT_SCALE_SUFFIXES: Array<[string, ChordQuery, number[]]> = [
    ['C+', chord('C', '+', ['C', 'E', 'G#']), [-1, 3, 2, 1, 1, -1]],
    ['C°7', chord('C', '°7', ['C', 'Eb', 'Gb', 'Bbb']), [-1, -1, 1, 2, 1, 2]],
    ['CmMaj7', chord('C', 'mMaj7', ['C', 'Eb', 'G', 'B']), [-1, 3, 1, 0, 0, -1]],
    ['Cmaj7#5', chord('C', 'maj7#5', ['C', 'E', 'G#', 'B']), [-1, 3, 2, 1, 0, 0]],
    ['CmMaj9', chord('C', 'mMaj9', ['C', 'Eb', 'G', 'B', 'D']), [-1, 3, 1, 4, 3, -1]],
  ]

  it.each(PARENT_SCALE_SUFFIXES)('finds %s under its chords-db name', async (_, query, frets) => {
    const [first] = await loadVoicings(query)

    expect(first?.frets).toEqual(frets)
  })

  // ORACLE — 8 8 9 8 8 10 sounds C F B Eb G D, verified by hand. The data's other three CmMaj11
  // positions have no 9th (D).
  it('finds CmMaj11 under its chords-db name, only the position with the 9th', async () => {
    const voicings = await loadVoicings(chord('C', 'mMaj11', ['C', 'Eb', 'G', 'B', 'D', 'F']))

    expect(voicings.map((v) => v.frets)).toEqual([[8, 8, 9, 8, 8, 10]])
  })
})

// Invariant over the whole catalogue: every voicing sounds only notes of its chord, and all of
// them except, optionally, the perfect fifth. Built from the standard tuning and hand-written
// chord formulas (semitones above the root), never from tonal or from the data's own note list.
const TUNING = [4, 9, 2, 7, 11, 4] // E A D G B E as pitch classes
/** [suffix as theory emits it, formula]. A 9th/11th/13th is written 2/5/9. Arrays, not records:
 * a record would visit the numeric suffixes (6, 9, 11, 13, 69) first. */
const V1_FORMULAS: Array<[string, number[]]> = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['°', [0, 3, 6]],
  ['maj7', [0, 4, 7, 11]],
  ['m7', [0, 3, 7, 10]],
  ['7', [0, 4, 7, 10]],
  ['m7b5', [0, 3, 6, 10]],
]
const EXTENDED_FORMULAS: Array<[string, number[]]> = [
  ['add9', [0, 4, 7, 2]],
  ['madd9', [0, 3, 7, 2]],
  ['6', [0, 4, 7, 9]],
  ['m6', [0, 3, 7, 9]],
  ['69', [0, 4, 7, 9, 2]],
  ['m69', [0, 3, 7, 9, 2]],
  ['maj9', [0, 4, 7, 11, 2]],
  ['maj11', [0, 4, 7, 11, 2, 5]],
  ['maj13', [0, 4, 7, 11, 2, 9]],
  ['9', [0, 4, 7, 10, 2]],
  ['11', [0, 4, 7, 10, 2, 5]],
  ['13', [0, 4, 7, 10, 2, 9]],
  ['m9', [0, 3, 7, 10, 2]],
  ['m11', [0, 3, 7, 10, 2, 5]],
]
/** The suffixes of the parent-scale qualities (harmonic minor), as theory emits them. */
const PARENT_SCALE_FORMULAS: Array<[string, number[]]> = [
  ['+', [0, 4, 8]],
  ['°7', [0, 3, 6, 9]],
  ['mMaj7', [0, 3, 7, 11]],
  ['maj7#5', [0, 4, 8, 11]],
  ['mMaj9', [0, 3, 7, 11, 2]],
  ['mMaj11', [0, 3, 7, 11, 2, 5]],
]
const PERFECT_FIFTH = 7
// One name per pitch class: the loader matches notes by pitch, so the spelling is irrelevant.
const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const ROOTS: Array<[string, number]> = CHROMATIC.map((name, pc): [string, number] => [name, pc])

const query = (root: string, pc: number, suffix: string, formula: number[]): ChordQuery =>
  chord(
    root,
    suffix,
    formula.map((interval) => CHROMATIC[(pc + interval) % 12]!),
  )

describe('loadVoicings over the whole catalogue', () => {
  it('has at least one voicing for each of the 12 roots and 7 v1 qualities', async () => {
    const missing: string[] = []
    for (const [root, pc] of ROOTS) {
      for (const [suffix, formula] of V1_FORMULAS) {
        if ((await loadVoicings(query(root, pc, suffix, formula))).length === 0) {
          missing.push(`${root} ${suffix}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  // ORACLE — the extended chords chords-db cannot voice, listed explicitly instead of skipped.
  // E madd9: the data's 4 positions sound F minor add9 (a chords-db erratum).
  // The 6 parent-scale suffixes add none: measured over the raw data (2026-10-29), each of their
  // 72 chords keeps at least one position (CmMaj11 only one: the others lack the 9th).
  it('lists exactly the extended chords with no voicing', async () => {
    const empty: string[] = []
    for (const [suffix, formula] of [...EXTENDED_FORMULAS, ...PARENT_SCALE_FORMULAS]) {
      for (const [root, pc] of ROOTS) {
        if ((await loadVoicings(query(root, pc, suffix, formula))).length === 0) {
          empty.push(`${root}${suffix}`)
        }
      }
    }

    expect(empty).toEqual([
      'Emadd9',
      'Cmaj11',
      'C#maj11',
      'Dmaj11',
      'Ebmaj11',
      'Emaj11',
      'F#maj11',
      'Gmaj11',
      'Abmaj11',
      'C#11',
      'D11',
      'Eb13',
      'E13',
      'F13',
      'F#13',
      'A13',
      'Bb13',
    ])
  })

  const ALL_FORMULAS = [...V1_FORMULAS, ...EXTENDED_FORMULAS, ...PARENT_SCALE_FORMULAS]

  it.each(ROOTS)(
    '%s: every voicing sounds only its chord and all of it but the perfect fifth',
    async (root, pc) => {
      const wrong: string[] = []
      for (const [suffix, formula] of ALL_FORMULAS) {
        const allowed = formula.map((interval) => (pc + interval) % 12)
        const required = formula
          .filter((interval) => interval !== PERFECT_FIFTH)
          .map((interval) => (pc + interval) % 12)
        for (const voicing of await loadVoicings(query(root, pc, suffix, formula))) {
          const sounding = voicing.frets.flatMap((fret, string) =>
            fret < 0 ? [] : [(TUNING[string]! + fret) % 12],
          )
          const fits =
            sounding.every((note) => allowed.includes(note)) &&
            required.every((note) => sounding.includes(note))
          if (!fits) wrong.push(`${root}${suffix} ${voicing.frets.join(' ')}`)
        }
      }

      expect(wrong).toEqual([])
    },
  )
})
