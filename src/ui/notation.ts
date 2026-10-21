import type { KeyMode, KeySignature } from '../theory/index.ts'

// Presentation only: turns theory spellings (`F#`, `Bbm`) into display and spoken text.
// The i18n slice will move the Spanish words into dictionaries.

const SYMBOL = /^([A-G])([#b]*)(.*)$/

/** `F#` → `F♯`, `Bbm` → `B♭m`, `B°` stays `B°`. */
export function displaySymbol(symbol: string): string {
  const match = SYMBOL.exec(symbol)
  if (match === null) return symbol
  const [, letter, accidentals = '', rest = ''] = match
  return letter + accidentals.replace(/#/g, '♯').replace(/b/g, '♭') + rest
}

/** For screen readers: `F#` → `F sostenido`, `Bb` → `B bemol`. */
export function spokenNote(note: string): string {
  const match = SYMBOL.exec(note)
  if (match === null) return note
  const [, letter = '', accidentals = ''] = match
  if (accidentals === '#') return `${letter} sostenido`
  if (accidentals === 'b') return `${letter} bemol`
  return letter
}

export function modeName(mode: KeyMode): string {
  return mode === 'major' ? 'mayor' : 'menor'
}

export function signatureText({ accidental, notes }: KeySignature): string {
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
}
