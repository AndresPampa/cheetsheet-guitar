import type { Messages } from './messages.ts'
import { characteristicText, displaySymbol, spokenNote } from './notation.ts'

const MODE_NAMES: Messages['modeName'] = {
  ionian: 'Ionian',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian',
  locrian: 'Locrian',
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export const en: Messages = {
  appTitle: 'Circle of Fifths',
  languageGroup: 'Language',

  circleRegion: 'Circle of fifths',
  chordRegion: 'Selected chord',
  modesRegion: 'Modes',

  keyMode: { major: 'major', minor: 'minor' },
  modeName: MODE_NAMES,
  // Mode names are proper nouns in English: `C Dorian`.
  modeContext: (root, mode) => `${root} ${MODE_NAMES[mode]}`,
  spokenNote: (note) =>
    spokenNote(note, {
      '#': 'sharp',
      b: 'flat',
      '##': 'double sharp',
      bb: 'double flat',
    }),

  keysGroup: 'Keys',
  sectorSpellings: (spoken) => spoken.join(' or '),
  sectorDegree: (roman) => `degree ${roman}`,

  keyRegion: 'Selected key',
  respell: (key) => `See as ${key}`,
  signature: ({ accidental, notes }) => {
    if (accidental === 'none') return 'Key signature: no accidentals'
    const count = plural(notes.length, accidental)
    return `Key signature: ${count} (${notes.map(displaySymbol).join(' ')})`
  },
  chordKindGroup: 'Chord type',
  triads: 'Triads',
  sevenths: 'Sevenths',
  diatonicChords: 'Diatonic chords',

  listen: 'Listen',
  listenTo: (symbol) => `Listen to ${symbol}`,
  degreeIn: (roman, context) => `Degree ${roman} · ${context}`,
  notes: (notes) => `Notes: ${notes}`,
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
  characteristic: (interval, note) => characteristicText(interval, note, 'major 6th'),
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
