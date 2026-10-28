import { getChordFormula } from './formula.ts'
import { diatonicChords, type SeventhQuality } from './key.ts'

/** Same values as the app's Triads / Sevenths switch. */
export type ChordBase = 'triads' | 'sevenths'
export type Extension = 9 | 11 | 13

export interface ExtendedChord {
  root: string
  /** In stacking order: 1 3 5 (7), then the chosen 9 11 13. */
  notes: string[]
  /** `b`/`#` in ASCII (`°` stays), as chords-db names it when it has it: `add9`, `69`, `maj7(#11)`. */
  suffix: string
  /** Display symbol: `Cadd9`, `C6/9`, `Em7(b9)`. */
  symbol: string
}

// A natural 9 on these sevenths renames the chord: Cmaj9, Dm9, G9 (and then maj11, m13, 13…).
const STACKED: Partial<Record<SeventhQuality, string>> = { maj7: 'maj', m7: 'm', '7': '' }

const withParens = (head: string, rest: string[], add: string) =>
  rest.length === 0 ? head : `${head}(${add}${rest.join(',')})`

/** `''`/`m`/`°` plus the extension labels (`9`, `#11`, `b13`…): `add9`, `m69`, `6(add#11)`. */
function triadSuffix(base: string, labels: string[]): string {
  if (base === '°') return withParens(base, labels, 'add')
  let head = base
  let rest = labels
  if (rest.includes('13')) {
    const sixNine = rest.includes('9')
    head += sixNine ? '69' : '6'
    rest = rest.filter((label) => label !== '13' && !(sixNine && label === '9'))
  }
  if (head === base && rest.length === 1 && (rest[0] === '9' || rest[0] === '11')) {
    return `${base}add${rest[0]}`
  }
  return withParens(head, rest, 'add')
}

/** `maj7`/`m7`/`7`/`m7b5` plus the extension labels: `maj9(#11)`, `13`, `m7b5(b9)`. */
function seventhSuffix(quality: SeventhQuality, labels: string[]): string {
  const stem = STACKED[quality]
  if (stem === undefined || labels[0] !== '9') return withParens(quality, labels, '')
  const top = labels[1] === '11' || labels[1] === '13' ? labels[1] : '9'
  return withParens(stem + top, labels.slice(top === '9' ? 1 : 2), '')
}

/**
 * The chord on `degree` (1–7) of `scale`, stacked in thirds: the triad or seventh plus up to two
 * of the 9th, 11th and 13th, taken from the same scale (so b9, #11 and b13 come out as they
 * are). Throws RangeError for a degree outside 1–7 or more than two, or repeated, extensions.
 */
export function getExtendedChord(
  scale: string[],
  degree: number,
  base: ChordBase,
  extensions: Extension[],
): ExtendedChord {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new RangeError(`invalid degree ${degree}`)
  }
  if (extensions.length > 2 || new Set(extensions).size !== extensions.length) {
    throw new RangeError(`invalid extensions ${extensions.join(',')}`)
  }
  const chord = diatonicChords(scale)[degree - 1]!
  const { root } = chord
  // The 9th, 11th and 13th are the 2nd, 4th and 6th scale degrees above the root.
  const added = [...extensions]
    .sort((a, b) => a - b)
    .map((extension) => scale[(degree - 1 + extension - 1) % 7]!)
  const labels = getChordFormula([root, ...added]).slice(1)
  const [notes, suffix] =
    base === 'sevenths'
      ? [chord.seventh.notes, seventhSuffix(chord.seventh.quality, labels)]
      : [chord.notes, triadSuffix(chord.symbol.slice(root.length), labels)]
  return { root, notes: [...notes, ...added], suffix, symbol: root + suffix.replace('69', '6/9') }
}
