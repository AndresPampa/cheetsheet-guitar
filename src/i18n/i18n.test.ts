import { describe, expect, it } from 'vitest'
import {
  getChordFormula,
  getExtendedChord,
  getParallelModes,
  type ChordBase,
  type Extension,
  type ModeName,
  type ParentScale,
} from '../theory/index.ts'
import { displayRoman, getMessages } from './index.ts'

const es = getMessages('es')
const en = getMessages('en')

describe('symbol, with letter names', () => {
  const cases: Array<[string, string]> = [
    ['C', 'C'],
    ['F#m7', 'F♯m7'],
    ['Bbmaj7', 'B♭maj7'],
    ['Bbb', 'B♭♭'],
    ['B°', 'B°'],
    ['N.C.', 'N.C.'],
    // v2.1: the alterations of the suffix get their signs too.
    ['Bm7b5', 'Bm7♭5'],
    ['Fmaj7(#11)', 'Fmaj7(♯11)'],
    ['Em7(b9,b13)', 'Em7(♭9,♭13)'],
    ['F#m7b5', 'F♯m7♭5'],
    ['C6/9', 'C6/9'],
  ]

  it.each(cases)('shows %s as %s', (symbol, shown) => {
    expect(getMessages('es').symbol(symbol)).toBe(shown)
  })
})

describe('displayRoman', () => {
  it('turns only the leading alteration into a sign', () => {
    expect(displayRoman('bVII')).toBe('♭VII')
    expect(displayRoman('#iv°')).toBe('♯iv°')
    expect(displayRoman('viiø7')).toBe('viiø7')
    expect(displayRoman('bIIImaj7')).toBe('♭IIImaj7')
    expect(displayRoman('bVII7b9')).toBe('♭VII7b9')
    expect(displayRoman('#iv7#5')).toBe('♯iv7#5')
  })
})

describe('getMessages', () => {
  describe('key signature', () => {
    const cases: Array<[string, Parameters<typeof es.signature>[0], string, string]> = [
      [
        'no accidentals',
        { accidental: 'none', notes: [] },
        'Armadura: sin alteraciones',
        'Key signature: no accidentals',
      ],
      [
        'one sharp',
        { accidental: 'sharp', notes: ['F#'] },
        'Armadura: 1 sostenido (F♯)',
        'Key signature: 1 sharp (F♯)',
      ],
      [
        'two sharps',
        { accidental: 'sharp', notes: ['F#', 'C#'] },
        'Armadura: 2 sostenidos (F♯ C♯)',
        'Key signature: 2 sharps (F♯ C♯)',
      ],
      [
        'one flat',
        { accidental: 'flat', notes: ['Bb'] },
        'Armadura: 1 bemol (B♭)',
        'Key signature: 1 flat (B♭)',
      ],
      [
        'three flats',
        { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab'] },
        'Armadura: 3 bemoles (B♭ E♭ A♭)',
        'Key signature: 3 flats (B♭ E♭ A♭)',
      ],
    ]

    it.each(cases)('names %s in both languages', (_, signature, spanish, english) => {
      expect(es.signature(signature)).toBe(spanish)
      expect(en.signature(signature)).toBe(english)
    })
  })

  // PRD story 12: a circle sector announces its signature as a count, without the notes.
  describe('sector signature, for screen readers', () => {
    const cases: Array<[string, Parameters<typeof es.sectorSignature>[0], string, string]> = [
      ['no accidentals', [{ accidental: 'none', notes: [] }], 'sin alteraciones', 'no accidentals'],
      ['one sharp', [{ accidental: 'sharp', notes: ['F#'] }], '1 sostenido', '1 sharp'],
      ['one flat', [{ accidental: 'flat', notes: ['Bb'] }], '1 bemol', '1 flat'],
      ['three flats', [{ accidental: 'flat', notes: ['Bb', 'Eb', 'Ab'] }], '3 bemoles', '3 flats'],
      [
        'both spellings of an enharmonic sector',
        [
          { accidental: 'sharp', notes: ['F#', 'C#', 'G#', 'D#', 'A#', 'E#'] },
          { accidental: 'flat', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] },
        ],
        '6 sostenidos o 6 bemoles',
        '6 sharps or 6 flats',
      ],
    ]

    it.each(cases)('counts %s in both languages', (_, signatures, spanish, english) => {
      expect(es.sectorSignature(signatures)).toBe(spanish)
      expect(en.sectorSignature(signatures)).toBe(english)
    })
  })

  describe('spoken notes, for screen readers', () => {
    const cases: Array<[string, string, string]> = [
      ['C', 'C', 'C'],
      ['F#', 'F sostenido', 'F sharp'],
      ['Bb', 'B bemol', 'B flat'],
      ['C##', 'C doble sostenido', 'C double sharp'],
      ['Bbb', 'B doble bemol', 'B double flat'],
      ['Bbbb', 'B triple bemol', 'B triple flat'],
      ['E#m', 'E sostenido', 'E sharp'],
    ]

    it.each(cases)('reads %s', (note, spanish, english) => {
      expect(es.spokenNote(note)).toBe(spanish)
      expect(en.spokenNote(note)).toBe(english)
    })
  })

  it('leaves what is not a note, or has an unknown alteration, as it is', () => {
    expect(es.spokenNote('N.C.')).toBe('N.C.')
    expect(en.spokenNote('F###')).toBe('F###')
  })

  it('names an interval it does not know by its code', () => {
    expect(en.characteristic('9M', 'D')).toBe('9M (D)')
  })

  it('names a mode in context: lowercase in Spanish, capitalized in English', () => {
    expect(es.modeContext('C', 'dorian')).toBe('C dórico')
    expect(en.modeContext('C', 'dorian')).toBe('C Dorian')
    expect(es.modeContext('F♯', 'mixolydian')).toBe('F♯ mixolidio')
    expect(en.modeContext('F♯', 'mixolydian')).toBe('F♯ Mixolydian')
  })

  it('names the characteristic note with its interval', () => {
    expect(es.characteristic('6M', 'A')).toBe('6ª mayor (A)')
    expect(en.characteristic('6M', 'A')).toBe('major 6th (A)')
    expect(es.characteristic('4A', 'F#')).toBe('♯4 (F♯)')
    expect(en.characteristic('5d', 'Gb')).toBe('♭5 (G♭)')
  })

  // The characteristic note of each mode of C, against C ionian.
  const characteristics: Array<[string, string, string, string]> = [
    ['dorian', '6M', 'A', '6ª mayor (A)'],
    ['phrygian', '2m', 'Db', '♭2 (D♭)'],
    ['lydian', '4A', 'F#', '♯4 (F♯)'],
    ['mixolydian', '7m', 'Bb', '♭7 (B♭)'],
    ['aeolian', '6m', 'Ab', '♭6 (A♭)'],
    ['locrian', '5d', 'Gb', '♭5 (G♭)'],
  ]

  it.each(characteristics)('names the characteristic of C %s', (_, interval, note, text) => {
    expect(es.characteristic(interval, note)).toBe(text)
  })

  it('names the diagram position and starting fret', () => {
    expect(es.position(1, 4)).toBe('Posición 1 de 4')
    expect(en.position(1, 4)).toBe('Position 1 of 4')
    expect(es.fromFret(3)).toBe('desde el traste 3')
    expect(en.fromFret(3)).toBe('from fret 3')
  })

  // The chord formula table: each degree header is named by its long interval name.
  // v2.1 adds the six extension degrees (9 b9 11 #11 13 b13) to the seven of v1; v2.0 (parent
  // scales, specs/chord-extensions "Nombres de los grados nuevos") adds #5 bb7 #9 b11.
  it('names every degree of a chord formula, up to the 13th, in Spanish', () => {
    expect(es.intervalName).toEqual({
      '1': 'fundamental',
      '3': '3ª mayor',
      b3: '3ª menor',
      '5': '5ª justa',
      b5: '5ª disminuida',
      '#5': '5ª aumentada',
      '7': '7ª mayor',
      b7: '7ª menor',
      bb7: '7ª disminuida',
      '9': '9ª mayor',
      b9: '9ª menor',
      '#9': '9ª aumentada',
      '11': '11ª justa',
      '#11': '11ª aumentada',
      b11: '11ª disminuida',
      '13': '13ª mayor',
      b13: '13ª menor',
    })
  })

  it('names every degree of a chord formula, up to the 13th, in English', () => {
    expect(en.intervalName).toEqual({
      '1': 'root',
      '3': 'major 3rd',
      b3: 'minor 3rd',
      '5': 'perfect 5th',
      b5: 'diminished 5th',
      '#5': 'augmented 5th',
      '7': 'major 7th',
      b7: 'minor 7th',
      bb7: 'diminished 7th',
      '9': 'major 9th',
      b9: 'minor 9th',
      '#9': 'augmented 9th',
      '11': 'perfect 11th',
      '#11': 'augmented 11th',
      b11: 'diminished 11th',
      '13': 'major 13th',
      b13: 'minor 13th',
    })
  })

  it('names the extensions selector, its visible label and its limit in both languages', () => {
    expect(es.extensionsGroup).toBe('Extensiones del acorde abierto')
    expect(en.extensionsGroup).toBe('Extensions of the open chord')
    expect(es.extensionsLabel).toBe('Extensiones')
    expect(en.extensionsLabel).toBe('Extensions')
    expect(es.maxExtensions).toBe('Máximo 2 extensiones')
    expect(en.maxExtensions).toBe('Up to 2 extensions')
  })

  it('names the formula table after the shown chord', () => {
    expect(es.formulaOf('Cm')).toBe('Fórmula de Cm')
    expect(en.formulaOf('Cm')).toBe('Formula of Cm')
  })
})

describe('solfège naming (Do Re Mi), independent of the language', () => {
  const esDo = getMessages('es', 'solfege')
  const enDo = getMessages('en', 'solfege')

  const symbols: Array<[string, string]> = [
    ['C', 'Do'],
    ['D', 'Re'],
    ['E', 'Mi'],
    ['F#', 'Fa♯'],
    ['G', 'Sol'],
    ['Ab', 'La♭'],
    ['Bb', 'Si♭'],
    ['F#m7', 'Fa♯m7'],
    ['Bbmaj7', 'Si♭maj7'],
    ['Bm7b5', 'Sim7♭5'],
    ['Bbmaj7(#11)', 'Si♭maj7(♯11)'],
    ['G°', 'Sol°'],
    ['Bbb', 'Si♭♭'],
    ['N.C.', 'N.C.'],
  ]

  it.each(symbols)('shows %s as %s, with signs in the chord suffix', (symbol, shown) => {
    expect(esDo.symbol(symbol)).toBe(shown)
    expect(enDo.symbol(symbol)).toBe(shown)
  })

  it('keeps letter names by default', () => {
    expect(getMessages('es').symbol('F#m7')).toBe('F♯m7')
    expect(getMessages('en', 'letters').symbol('Bb')).toBe('B♭')
  })

  it('reads the solfège name for screen readers, with the words of the language', () => {
    expect(esDo.spokenNote('F#')).toBe('Fa sostenido')
    expect(enDo.spokenNote('Bb')).toBe('Si flat')
    expect(esDo.spokenNote('E#m')).toBe('Mi sostenido')
    expect(enDo.spokenNote('C')).toBe('Do')
    expect(esDo.spokenNote('Gbb')).toBe('Sol doble bemol')
  })

  it('names the notes of the key signature and the characteristic note in solfège', () => {
    expect(esDo.signature({ accidental: 'sharp', notes: ['F#', 'C#'] })).toBe(
      'Armadura: 2 sostenidos (Fa♯ Do♯)',
    )
    expect(enDo.signature({ accidental: 'flat', notes: ['Bb'] })).toBe(
      'Key signature: 1 flat (Si♭)',
    )
    expect(esDo.characteristic('6M', 'A')).toBe('6ª mayor (La)')
    expect(enDo.characteristic('4A', 'F#')).toBe('♯4 (Fa♯)')
  })
})

// Property (specs/chord-extensions, "Ningún grado alcanzable sin nombre"): over the harmonic
// minor, every degree a chord formula can reach is one of these hand-written labels and has a
// long name in both languages. The 18 roots the circle can select, written by hand.
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
const REACHABLE_LABELS = new Set('1 3 b3 5 b5 #5 7 b7 bb7 9 b9 #9 11 #11 b11 13 b13'.split(' '))
const BASES: ChordBase[] = ['triads', 'sevenths']
const EXTENSION_COMBOS: Extension[][] = [[], [9], [11], [13], [9, 11], [9, 13], [11, 13]]

const formulaLabels = (root: string, parent: ParentScale): Set<string> =>
  new Set(
    getParallelModes(root, parent).flatMap((mode) =>
      [1, 2, 3, 4, 5, 6, 7].flatMap((degree) =>
        BASES.flatMap((base) =>
          EXTENSION_COMBOS.flatMap((exts) =>
            getChordFormula(getExtendedChord(mode.scale, degree, base, exts).notes),
          ),
        ),
      ),
    ),
  )

const HARMONIC_AND_MELODIC: Array<[string, ParentScale]> = CIRCLE_ROOTS.flatMap((root) => [
  [root, 'harmonic'],
  [root, 'melodic'],
])

describe('intervalName over the harmonic and melodic minor parent scales', () => {
  it.each(HARMONIC_AND_MELODIC)(
    '%s %s: every reachable formula degree is a known label named in Spanish and English',
    (root, parent) => {
      const labels = [...formulaLabels(root, parent)]

      expect(labels.filter((label) => !REACHABLE_LABELS.has(label))).toEqual([])
      expect(labels.filter((label) => es.intervalName[label] === undefined)).toEqual([])
      expect(labels.filter((label) => en.intervalName[label] === undefined)).toEqual([])
    },
  )
})

describe('the harmonic minor parent scale', () => {
  const names: Array<[ModeName, string, string, string, string]> = [
    ['locrian-nat6', 'Locrio ♮6', 'Locrio natural 6', 'Locrian ♮6', 'Locrian natural 6'],
    ['ionian-sharp5', 'Jónico ♯5', 'Jónico sostenido 5', 'Ionian ♯5', 'Ionian sharp 5'],
    ['dorian-sharp4', 'Dórico ♯4', 'Dórico sostenido 4', 'Dorian ♯4', 'Dorian sharp 4'],
    ['lydian-sharp2', 'Lidio ♯2', 'Lidio sostenido 2', 'Lydian ♯2', 'Lydian sharp 2'],
    [
      'superlocrian-bb7',
      'Superlocrio ♭♭7',
      'Superlocrio doble bemol 7',
      'Superlocrian ♭♭7',
      'Superlocrian double flat 7',
    ],
    ['harmonic-minor', 'Menor armónica', 'Menor armónica', 'Harmonic minor', 'Harmonic minor'],
    ['dorian', 'Dórico', 'Dórico', 'Dorian', 'Dorian'],
  ]

  it.each(names)(
    'shows %s with signs and reads it in words',
    (mode, esShown, esSpoken, enShown, enSpoken) => {
      expect([es.modeName[mode], es.modeSpoken[mode]]).toEqual([esShown, esSpoken])
      expect([en.modeName[mode], en.modeSpoken[mode]]).toEqual([enShown, enSpoken])
    },
  )

  it('reads a mode in context with its spoken name', () => {
    expect(es.modeContextSpoken('C', 'locrian-nat6')).toBe('C locrio natural 6')
    expect(en.modeContextSpoken('C', 'locrian-nat6')).toBe('C Locrian natural 6')
  })

  // The characteristic note of each mode of C harmonic minor, against its closest Greek mode.
  const characteristics: Array<[string, string, string]> = [
    ['7M', 'B', '♮7 (B)'],
    ['6M', 'A', '6ª mayor (A)'],
    ['5A', 'G#', '♯5 (G♯)'],
    ['4A', 'F#', '♯4 (F♯)'],
    ['3M', 'E', '♮3 (E)'],
    ['2A', 'D#', '♯2 (D♯)'],
    ['7d', 'Bbb', '♭♭7 (B♭♭)'],
  ]

  it.each(characteristics)('names the characteristic %s (%s) as %s', (interval, note, text) => {
    expect(es.characteristic(interval, note)).toBe(text)
  })

  it('names the modes table after its parent scale', () => {
    expect(es.modesCaption('C', 'major')).toBe('Modos de la escala mayor de C')
    expect(es.modesCaption('A', 'harmonic')).toBe('Modos de la menor armónica de A')
    expect(en.modesCaption('C', 'major')).toBe('Modes of the C major scale')
    expect(en.modesCaption('C', 'harmonic')).toBe('Modes of C harmonic minor')
    expect(getMessages('es', 'solfege').modesCaption('La', 'harmonic')).toBe(
      'Modos de la menor armónica de La',
    )
  })

  it('names each parent scale short on the switch and in full elsewhere', () => {
    expect(es.parentScaleShort).toEqual({
      major: 'Mayor',
      harmonic: 'Armónica',
      melodic: 'Melódica',
    })
    expect(es.parentScaleName).toEqual({
      major: 'Escala mayor',
      harmonic: 'Menor armónica',
      melodic: 'Menor melódica',
    })
    expect(en.parentScaleShort).toEqual({
      major: 'Major',
      harmonic: 'Harmonic',
      melodic: 'Melodic',
    })
    expect(en.parentScaleName).toEqual({
      major: 'Major scale',
      harmonic: 'Harmonic minor',
      melodic: 'Melodic minor',
    })
  })
})

describe('the melodic minor parent scale', () => {
  const names: Array<[ModeName, string, string, string, string]> = [
    ['melodic-minor', 'Menor melódica', 'Menor melódica', 'Melodic minor', 'Melodic minor'],
    ['dorian-b2', 'Dórico ♭2', 'Dórico bemol 2', 'Dorian ♭2', 'Dorian flat 2'],
    [
      'lydian-augmented',
      'Lidio aumentado',
      'Lidio aumentado',
      'Lydian augmented',
      'Lydian augmented',
    ],
    ['lydian-dominant', 'Lidio dominante', 'Lidio dominante', 'Lydian dominant', 'Lydian dominant'],
    ['mixolydian-b6', 'Mixolidio ♭6', 'Mixolidio bemol 6', 'Mixolydian ♭6', 'Mixolydian flat 6'],
    ['locrian-nat2', 'Locrio ♮2', 'Locrio natural 2', 'Locrian ♮2', 'Locrian natural 2'],
    ['altered', 'Alterado', 'Alterado', 'Altered', 'Altered'],
  ]

  it.each(names)(
    'shows %s with signs and reads it in words',
    (mode, esShown, esSpoken, enShown, enSpoken) => {
      expect([es.modeName[mode], es.modeSpoken[mode]]).toEqual([esShown, esSpoken])
      expect([en.modeName[mode], en.modeSpoken[mode]]).toEqual([enShown, enSpoken])
    },
  )

  // The characteristic note of each mode of C melodic minor, against its closest Greek mode.
  const characteristics: Array<[string, string, string]> = [
    ['7M', 'B', '♮7 (B)'],
    ['6M', 'A', '6ª mayor (A)'],
    ['5A', 'G#', '♯5 (G♯)'],
    ['7m', 'Bb', '♭7 (B♭)'],
    ['6m', 'Ab', '♭6 (A♭)'],
    ['2M', 'D', '♮2 (D)'],
    ['4d', 'Fb', '♭4 (F♭)'],
  ]

  it.each(characteristics)('names the characteristic %s (%s) as %s', (interval, note, text) => {
    expect(es.characteristic(interval, note)).toBe(text)
  })

  it('names the modes table after the melodic minor', () => {
    expect(es.modesCaption('C', 'melodic')).toBe('Modos de la menor melódica de C')
    expect(en.modesCaption('A', 'melodic')).toBe('Modes of A melodic minor')
  })
})
