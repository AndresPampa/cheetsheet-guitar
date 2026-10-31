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
  'melodic-minor': 'Melodic minor',
  'dorian-b2': 'Dorian ♭2',
  'lydian-augmented': 'Lydian augmented',
  'lydian-dominant': 'Lydian dominant',
  'mixolydian-b6': 'Mixolydian ♭6',
  'locrian-nat2': 'Locrian ♮2',
  altered: 'Altered',
}

const MODE_SPOKEN: Messages['modeSpoken'] = {
  ...MODE_NAMES,
  'locrian-nat6': 'Locrian natural 6',
  'ionian-sharp5': 'Ionian sharp 5',
  'dorian-sharp4': 'Dorian sharp 4',
  'lydian-sharp2': 'Lydian sharp 2',
  'superlocrian-bb7': 'Superlocrian double flat 7',
  'dorian-b2': 'Dorian flat 2',
  'mixolydian-b6': 'Mixolydian flat 6',
  'locrian-nat2': 'Locrian natural 2',
}

const PARENT_SCALE_NAMES: Messages['parentScaleName'] = {
  major: 'Major scale',
  harmonic: 'Harmonic minor',
  melodic: 'Melodic minor',
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
    modeSpoken: MODE_SPOKEN,
    modeContextSpoken: (root, mode) => `${root} ${MODE_SPOKEN[mode]}`,
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
    harmonicShortcut: { chords: 'V7 and vii°7', joiner: 'in', target: 'harmonic minor' },

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
      // Degrees only the minor parent scales' modes reach.
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

    modesCaption: (root, scale) =>
      scale === 'major'
        ? `Modes of the ${root} major scale`
        : `Modes of ${root} ${PARENT_SCALE_NAMES[scale].toLowerCase()}`,
    parentScaleGroup: 'Parent scale',
    parentScaleShort: { major: 'Major', harmonic: 'Harmonic', melodic: 'Melodic' },
    parentScaleName: PARENT_SCALE_NAMES,
    yourKey: 'your key',
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
