import type { Messages } from './messages.ts'
import { characteristicText, displaySymbol, spokenNote } from './notation.ts'

const MODE_NAMES: Messages['modeName'] = {
  ionian: 'Jónico',
  dorian: 'Dórico',
  phrygian: 'Frigio',
  lydian: 'Lidio',
  mixolydian: 'Mixolidio',
  aeolian: 'Eólico',
  locrian: 'Locrio',
}

export const es: Messages = {
  appTitle: 'Círculo de Quintas',
  languageGroup: 'Idioma',

  circleRegion: 'Círculo de quintas',
  chordRegion: 'Acorde seleccionado',
  modesRegion: 'Modos',

  keyMode: { major: 'mayor', minor: 'menor' },
  modeName: MODE_NAMES,
  modeContext: (root, mode) => `${root} ${MODE_NAMES[mode].toLowerCase()}`,
  spokenNote: (note) =>
    spokenNote(note, {
      '#': 'sostenido',
      b: 'bemol',
      '##': 'doble sostenido',
      bb: 'doble bemol',
    }),

  keysGroup: 'Tonalidades',
  sectorSpellings: (spoken) => spoken.join(' o '),
  sectorDegree: (roman) => `grado ${roman}`,

  keyRegion: 'Tonalidad seleccionada',
  respell: (key) => `Ver como ${key}`,
  signature: ({ accidental, notes }) => {
    if (accidental === 'none') return 'Armadura: sin alteraciones'
    const count = notes.length
    const word =
      accidental === 'sharp'
        ? count === 1
          ? 'sostenido'
          : 'sostenidos'
        : count === 1
          ? 'bemol'
          : 'bemoles'
    return `Armadura: ${count} ${word} (${notes.map(displaySymbol).join(' ')})`
  },
  chordKindGroup: 'Tipo de acorde',
  triads: 'Triadas',
  sevenths: 'Séptimas',
  diatonicChords: 'Acordes diatónicos',

  listen: 'Escuchar',
  listenTo: (symbol) => `Escuchar ${symbol}`,
  degreeIn: (roman, context) => `Grado ${roman} · ${context}`,
  notes: (notes) => `Notas: ${notes}`,
  appearsIn: 'Aparece en:',
  modesContaining: 'Modos donde aparece',
  mostRepresentative: '(más representativo)',

  loadingDiagram: 'Cargando diagrama…',
  diagramFailed: 'No se pudo cargar el diagrama',
  noDiagram: 'No hay diagrama para este acorde',
  diagramLabel: (name, tablature) => `Diagrama de ${name}: cuerdas de 6ª a 1ª ${tablature}`,
  fromFret: (fret) => `desde el traste ${fret}`,
  previousPosition: 'Posición anterior',
  nextPosition: 'Posición siguiente',
  position: (current, total) => `Posición ${current} de ${total}`,

  modesCaption: (root) => `Modos paralelos de ${root}`,
  modeColumn: 'Modo',
  characteristicColumn: 'Nota característica',
  noCharacteristic: 'ninguna (referencia)',
  characteristic: (interval, note) => characteristicText(interval, note, '6ª mayor'),
  hasCharacteristic: '(característica)',
  borrowed: '(prestado)',
  legend: {
    star: 'más representativo',
    underlined: 'subrayado',
    containsCharacteristic: 'contiene la nota característica',
    dashed: 'borde punteado',
    borrowed: 'prestado (difiere del jónico)',
  },
}
