import { describe, expect, it } from 'vitest'
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
    expect(en.characteristic('3M', 'E')).toBe('3M (E)')
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
  it('names the seven degrees of a v1 chord formula in Spanish', () => {
    expect(es.intervalName).toEqual({
      '1': 'fundamental',
      '3': '3ª mayor',
      b3: '3ª menor',
      '5': '5ª justa',
      b5: '5ª disminuida',
      '7': '7ª mayor',
      b7: '7ª menor',
    })
  })

  it('names the seven degrees of a v1 chord formula in English', () => {
    expect(en.intervalName).toEqual({
      '1': 'root',
      '3': 'major 3rd',
      b3: 'minor 3rd',
      '5': 'perfect 5th',
      b5: 'diminished 5th',
      '7': 'major 7th',
      b7: 'minor 7th',
    })
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
    ['Bm7b5', 'Sim7b5'],
    ['G°', 'Sol°'],
    ['Bbb', 'Si♭♭'],
    ['N.C.', 'N.C.'],
  ]

  it.each(symbols)('shows %s as %s, keeping the chord suffix', (symbol, shown) => {
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
