// Presentation only: turns theory spellings (`F#`, `Bbm`) into display text, in any language.

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

/** `F#` → `F♯`, `Bbm` → `B♭m`, `B°` stays `B°`. */
export function displaySymbol(symbol: string): string {
  const parsed = parseSymbol(symbol)
  if (parsed === null) return symbol
  return parsed.letter + signs(parsed.accidentals) + parsed.rest
}

export type AccidentalWords = Record<'#' | 'b' | '##' | 'bb', string>

/** `F#` + `{ '#': 'sostenido' }` → `F sostenido`; `E#m` reads its root; unknown stays as is. */
export function spokenNote(note: string, words: AccidentalWords): string {
  const parsed = parseSymbol(note)
  if (parsed === null) return note
  const { letter, accidentals } = parsed
  if (accidentals === '') return letter
  const word = words[accidentals as keyof AccidentalWords] as string | undefined
  return word === undefined ? note : `${letter} ${word}`
}

// The six characteristic intervals of the major-scale modes; only the major sixth has words.
const CHARACTERISTIC_SIGNS: Record<string, string> = {
  '2m': '♭2',
  '4A': '♯4',
  '7m': '♭7',
  '6m': '♭6',
  '5d': '♭5',
}

/** `6M` + `A` + `6ª mayor` → `6ª mayor (A)`; `4A` + `F#` → `♯4 (F♯)`. */
export function characteristicText(interval: string, note: string, majorSixth: string): string {
  const name = interval === '6M' ? majorSixth : (CHARACTERISTIC_SIGNS[interval] ?? interval)
  return `${name} (${displaySymbol(note)})`
}

/** `bVII` → `♭VII`, `#iv°` → `♯iv°`: only the leading alteration is a sign. */
export function displayRoman(roman: string): string {
  const [, alteration = '', rest = ''] = /^([#b]*)(.*)$/.exec(roman) ?? []
  return signs(alteration) + rest
}
