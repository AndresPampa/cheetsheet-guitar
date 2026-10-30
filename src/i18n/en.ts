import type { KeySignature } from '../theory/index.ts'
import type { Messages } from './messages.ts'
import type { Notation } from './notation.ts'
import { characteristicText, displaySymbol, spokenNote } from './notation.ts'

const MODE_NAMES: Messages['modeName'] = {
  ionian: 'Ionian',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian',
  locrian: 'Locrian',
  'harmonic-minor': 'Harmonic minor',
  'locrian-nat6': 'Locrian ♮6',
  'ionian-sharp5': 'Ionian ♯5',
  'dorian-sharp4': 'Dorian ♯4',
  'phrygian-dominant': 'Phrygian dominant',
  'lydian-sharp2': 'Lydian ♯2',
  'superlocrian-bb7': 'Superlocrian ♭♭7',
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** `no accidentals`, `1 sharp`, `3 flats`. */
const signatureCount = ({ accidental, notes }: KeySignature): string =>
  accidental === 'none' ? 'no accidentals' : plural(notes.length, accidental)

/** The English dictionary, naming notes as `notation` says. */
export function en(notation: Notation): Messages {
  const symbol = (note: string) => displaySymbol(note, notation)
  return {
    symbol,
    appTitle: 'Circle of Fifths',
    noteNamesGroup: 'Note names',
    themeGroup: 'Theme',
    themes: { dark: 'Dark', light: 'Light' },
    languageGroup: 'Language',

    circleRegion: 'Circle of fifths',
    chordRegion: 'Selected chord',
    modesRegion: 'Modes',

    keyMode: { major: 'major', minor: 'minor' },
    modeName: MODE_NAMES,
    // Mode names are proper nouns in English: `C Dorian`.
    modeContext: (root, mode) => `${root} ${MODE_NAMES[mode]}`,
    spokenNote: (note) =>
      spokenNote(
        note,
        {
          '#': 'sharp',
          b: 'flat',
          '##': 'double sharp',
          bb: 'double flat',
          bbb: 'triple flat',
        },
        notation,
      ),

    keysGroup: 'Keys',
    sectorSpellings: (spoken) => spoken.join(' or '),
    sectorDegree: (roman) => `degree ${roman}`,
    sectorSignature: (signatures) => signatures.map(signatureCount).join(' or '),

    keyRegion: 'Selected key',
    respell: (key) => `See as ${key}`,
    signature: (signature) =>
      signature.accidental === 'none'
        ? `Key signature: ${signatureCount(signature)}`
        : `Key signature: ${signatureCount(signature)} (${signature.notes.map(symbol).join(' ')})`,
    chordKindGroup: 'Chord type',
    triads: 'Triads',
    sevenths: 'Sevenths',
    diatonicChords: 'Diatonic chords',

    listen: 'Listen',
    listenTo: (shown) => `Listen to ${shown}`,
    degreeIn: (roman, context) => `Degree ${roman} · ${context}`,
    formulaOf: (symbol) => `Formula of ${symbol}`,
    intervalName: {
      '1': 'root',
      '3': 'major 3rd',
      b3: 'minor 3rd',
      '5': 'perfect 5th',
      b5: 'diminished 5th',
      '7': 'major 7th',
      b7: 'minor 7th',
      '9': 'major 9th',
      b9: 'minor 9th',
      '11': 'perfect 11th',
      '#11': 'augmented 11th',
      '13': 'major 13th',
      b13: 'minor 13th',
      // Degrees only the harmonic minor's modes reach.
      '#5': 'augmented 5th',
      bb7: 'diminished 7th',
      '#9': 'augmented 9th',
      b11: 'diminished 11th',
    },
    extensionsGroup: 'Extensions of the open chord',
    extensionsLabel: 'Extensions',
    maxExtensions: 'Up to 2 extensions',
    appearsIn: 'Appears in:',
    modesContaining: 'Modes containing it',
    mostRepresentative: '(most representative)',

    loadingDiagram: 'Loading diagram…',
    diagramFailed: 'Could not load the diagram',
    noDiagram: 'No diagram for this chord',
    diagramLabel: (name, tablature) => `Diagram of ${name}: strings 6th to 1st ${tablature}`,
    fromFret: (fret) => `from fret ${fret}`,
    previousPosition: 'Previous position',
    nextPosition: 'Next position',
    position: (current, total) => `Position ${current} of ${total}`,

    modesCaption: (root) => `Parallel modes of ${root}`,
    modeColumn: 'Mode',
    characteristicColumn: 'Characteristic note',
    noCharacteristic: 'none (reference)',
    characteristic: (interval, note) => characteristicText(interval, symbol(note), 'major 6th'),
    hasCharacteristic: '(characteristic)',
    borrowed: '(borrowed)',
    legend: {
      star: 'most representative',
      underlined: 'underlined',
      containsCharacteristic: 'contains the characteristic note',
      dashed: 'dashed border',
      borrowed: 'borrowed (differs from Ionian)',
    },
  }
}
