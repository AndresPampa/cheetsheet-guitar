// Presentation only: turns theory spellings (`F#`, `Bbm`) into display text, in any language
// and in either note naming. Theory and audio keep the letter spelling.

/** C D E or Do Re Mi: independent of the language of the interface. */
export type Notation = 'letters' | 'solfege'

const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const noteName = (letter: string, notation: Notation) =>
  notation === 'solfege' ? (SOLFEGE[letter] ?? letter) : letter

const SYMBOL = /^([A-G])([#b]*)(.*)$/

/** `F#m7` → `{ letter: 'F', accidentals: '#', rest: 'm7' }`; `null` for anything else. */
export function parseSymbol(
  symbol: string,
): { letter: string; accidentals: string; rest: string } | null {
  const match = SYMBOL.exec(symbol)
  if (match === null) return null
  const [, letter = '', accidentals = '', rest = ''] = match
  return { letter, accidentals, rest }
}

const signs = (accidentals: string) => accidentals.replace(/#/g, '♯').replace(/b/g, '♭')

/** `F#` → `F♯` (or `Fa♯`), `Bbm` → `B♭m`, `Bm7b5` → `Bm7♭5`, `Fmaj7(#11)` → `Fmaj7(♯11)`. */
export function displaySymbol(symbol: string, notation: Notation = 'letters'): string {
  const parsed = parseSymbol(symbol)
  if (parsed === null) return symbol
  // Suffixes only spell alterations with `b` and `#`, so the same signs apply to them.
  return noteName(parsed.letter, notation) + signs(parsed.accidentals) + signs(parsed.rest)
}

export type AccidentalWords = Record<'#' | 'b' | '##' | 'bb' | 'bbb', string>

/** `F#` + `{ '#': 'sostenido' }` → `F sostenido` (or `Fa sostenido`); `E#m` reads its root. */
export function spokenNote(note: string, words: AccidentalWords, notation: Notation): string {
  const parsed = parseSymbol(note)
  if (parsed === null) return note
  const name = noteName(parsed.letter, notation)
  if (parsed.accidentals === '') return name
  const word = words[parsed.accidentals as keyof AccidentalWords] as string | undefined
  return word === undefined ? note : `${name} ${word}`
}

// The characteristic intervals of every mode, against the closest Greek mode; only the major
// sixth has words.
const CHARACTERISTIC_SIGNS: Record<string, string> = {
  '2m': '♭2',
  '4A': '♯4',
  '7m': '♭7',
  '6m': '♭6',
  '5d': '♭5',
  '7M': '♮7',
  '3M': '♮3',
  '5A': '♯5',
  '2A': '♯2',
  '7d': '♭♭7',
}

/** `6M` + `A` + `6ª mayor` → `6ª mayor (A)`; `4A` + `F#` → `♯4 (F♯)`. */
export function characteristicText(
  interval: string,
  shownNote: string,
  majorSixth: string,
): string {
  const name = interval === '6M' ? majorSixth : (CHARACTERISTIC_SIGNS[interval] ?? interval)
  return `${name} (${shownNote})`
}

/** `bVII` → `♭VII`, `#iv°` → `♯iv°`: only the leading alteration is a sign. */
export function displayRoman(roman: string): string {
  const [, alteration = '', rest = ''] = /^([#b]*)(.*)$/.exec(roman) ?? []
  return signs(alteration) + rest
}
