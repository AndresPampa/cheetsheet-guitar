import { describe, expect, it } from 'vitest'
import { displayRoman, displaySymbol, getMessages } from './index.ts'

const es = getMessages('es')
const en = getMessages('en')

describe('displaySymbol', () => {
  const cases: Array<[string, string]> = [
    ['C', 'C'],
    ['F#m7', 'F♯m7'],
    ['Bbmaj7', 'B♭maj7'],
    ['Bbb', 'B♭♭'],
    ['B°', 'B°'],
    ['N.C.', 'N.C.'],
  ]

  it.each(cases)('shows %s as %s', (symbol, shown) => {
    expect(displaySymbol(symbol)).toBe(shown)
  })
})

describe('displayRoman', () => {
  it('turns only the leading alteration into a sign', () => {
    expect(displayRoman('bVII')).toBe('♭VII')
    expect(displayRoman('#iv°')).toBe('♯iv°')
    expect(displayRoman('viiø7')).toBe('viiø7')
    expect(displayRoman('bIIImaj7')).toBe('♭IIImaj7')
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

  it('names the diagram position and starting fret', () => {
    expect(es.position(1, 4)).toBe('Posición 1 de 4')
    expect(en.position(1, 4)).toBe('Position 1 of 4')
    expect(es.fromFret(3)).toBe('desde el traste 3')
    expect(en.fromFret(3)).toBe('from fret 3')
  })
})
