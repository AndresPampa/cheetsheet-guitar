import type { KeyMode, KeySignature, ModeName } from '../theory/index.ts'

export type Language = 'es' | 'en'

/**
 * Every text the UI shows or announces. Both dictionaries implement it, so a missing
 * translation is a type error. Functions take theory spellings (`F#`) unless they say otherwise.
 */
export interface Messages {
  /** A note or chord in the current note naming: `F#m7` → `F♯m7` or `Fa♯m7`. */
  symbol: (symbol: string) => string
  appTitle: string
  languageGroup: string
  noteNamesGroup: string
  themeGroup: string
  themes: { dark: string; light: string }

  // Panels (landmark regions)
  circleRegion: string
  chordRegion: string
  modesRegion: string

  keyMode: Record<KeyMode, string>
  modeName: Record<ModeName, string>
  /** Root plus mode, as the chord panel names where a chord comes from: `C dórico`. */
  modeContext: (displayedRoot: string, mode: ModeName) => string
  /** For screen readers: `F#` → `F sostenido`; a chord symbol reads its root. */
  spokenNote: (note: string) => string

  // Circle of fifths
  keysGroup: string
  /** `C sostenido o D bemol`: the spoken spellings of one sector. */
  sectorSpellings: (spoken: string[]) => string
  sectorDegree: (roman: string) => string
  /** `6 sostenidos o 6 bemoles`: the signature count of each spelling of one sector. */
  sectorSignature: (signatures: KeySignature[]) => string

  // Key panel
  keyRegion: string
  respell: (displayedKey: string) => string
  signature: (signature: KeySignature) => string
  chordKindGroup: string
  triads: string
  sevenths: string
  diatonicChords: string

  // Chord panel
  listen: string
  listenTo: (displayedSymbol: string) => string
  degreeIn: (displayedRoman: string, context: string) => string
  /** Accessible name of the formula table: `Fórmula de Cm`. */
  formulaOf: (displayedSymbol: string) => string
  /** Long name per degree of a formula (`b3` → `3ª menor`), read instead of the sign. */
  intervalName: Record<string, string>
  /** Accessible name of the 9 / 11 / 13 toggles: they change only the open chord. */
  extensionsGroup: string
  /** Short visible label next to them. */
  extensionsLabel: string
  /** Shown, and read on the disabled toggle, when two extensions are chosen. */
  maxExtensions: string
  appearsIn: string
  modesContaining: string
  mostRepresentative: string

  // Chord diagram
  loadingDiagram: string
  diagramFailed: string
  noDiagram: string
  diagramLabel: (displayedName: string, tablature: string) => string
  fromFret: (fret: number) => string
  previousPosition: string
  nextPosition: string
  position: (current: number, total: number) => string

  // Parallel modes table
  modesCaption: (displayedRoot: string) => string
  modeColumn: string
  characteristicColumn: string
  noCharacteristic: string
  /** `6M` + `A` → `6ª mayor (A)`. */
  characteristic: (interval: string, note: string) => string
  hasCharacteristic: string
  borrowed: string
  legend: {
    star: string
    underlined: string
    containsCharacteristic: string
    dashed: string
    borrowed: string
  }
}
