import type { KeySignature } from '../theory/index.ts'
import type { Messages } from './messages.ts'
import type { Notation } from './notation.ts'
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

/** `sin alteraciones`, `1 sostenido`, `3 bemoles`. */
function signatureCount({ accidental, notes }: KeySignature): string {
  if (accidental === 'none') return 'sin alteraciones'
  const count = notes.length
  const word =
    accidental === 'sharp'
      ? count === 1
        ? 'sostenido'
        : 'sostenidos'
      : count === 1
        ? 'bemol'
        : 'bemoles'
  return `${count} ${word}`
}

/** The Spanish dictionary, naming notes as `notation` says. */
export function es(notation: Notation): Messages {
  const symbol = (note: string) => displaySymbol(note, notation)
  return {
    symbol,
    appTitle: 'Círculo de Quintas',
    noteNamesGroup: 'Nombres de notas',
    themeGroup: 'Tema',
    themes: { dark: 'Oscuro', light: 'Claro' },
    languageGroup: 'Idioma',

    circleRegion: 'Círculo de quintas',
    chordRegion: 'Acorde seleccionado',
    modesRegion: 'Modos',

    keyMode: { major: 'mayor', minor: 'menor' },
    modeName: MODE_NAMES,
    modeContext: (root, mode) => `${root} ${MODE_NAMES[mode].toLowerCase()}`,
    spokenNote: (note) =>
      spokenNote(
        note,
        {
          '#': 'sostenido',
          b: 'bemol',
          '##': 'doble sostenido',
          bb: 'doble bemol',
        },
        notation,
      ),

    keysGroup: 'Tonalidades',
    sectorSpellings: (spoken) => spoken.join(' o '),
    sectorDegree: (roman) => `grado ${roman}`,
    sectorSignature: (signatures) => signatures.map(signatureCount).join(' o '),

    keyRegion: 'Tonalidad seleccionada',
    respell: (key) => `Ver como ${key}`,
    signature: (signature) =>
      signature.accidental === 'none'
        ? `Armadura: ${signatureCount(signature)}`
        : `Armadura: ${signatureCount(signature)} (${signature.notes.map(symbol).join(' ')})`,
    chordKindGroup: 'Tipo de acorde',
    triads: 'Triadas',
    sevenths: 'Séptimas',
    diatonicChords: 'Acordes diatónicos',

    listen: 'Escuchar',
    listenTo: (shown) => `Escuchar ${shown}`,
    degreeIn: (roman, context) => `Grado ${roman} · ${context}`,
    formulaOf: (symbol) => `Fórmula de ${symbol}`,
    intervalName: {
      '1': 'fundamental',
      '3': '3ª mayor',
      b3: '3ª menor',
      '5': '5ª justa',
      b5: '5ª disminuida',
      '7': '7ª mayor',
      b7: '7ª menor',
      '9': '9ª mayor',
      b9: '9ª menor',
      '11': '11ª justa',
      '#11': '11ª aumentada',
      '13': '13ª mayor',
      b13: '13ª menor',
    },
    extensionsGroup: 'Extensiones del acorde abierto',
    extensionsLabel: 'Extensiones',
    maxExtensions: 'Máximo 2 extensiones',
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
    characteristic: (interval, note) => characteristicText(interval, symbol(note), '6ª mayor'),
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
}
