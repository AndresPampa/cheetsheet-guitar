import {
  getKey,
  getParallelModes,
  type Extension,
  type KeyMode,
  type ModeName,
} from '../theory/index.ts'
import type { Language, Notation } from '../i18n/index.ts'

/** Which chord on each degree the panels list. The circle always shows triads. */
export type ChordKind = 'triads' | 'sevenths'
export type { Language, Notation }

/**
 * The chord open in the panel, by origin and degree rather than by value: it follows the
 * triads/sevenths switch and is recomputed from the current key and modes.
 */
export interface ChordRef {
  source: 'key' | ModeName
  degree: number
}

/** Everything the URL carries. The theme is not here: it is a device preference. */
export interface AppState {
  tonic: string
  mode: KeyMode
  chordKind: ChordKind
  chord: ChordRef
  /** Added to the open chord, in stacking order: `[]`, `[9]`, `[9, 13]`. */
  extensions: Extension[]
  notation: Notation
  language: Language
}

export const DEFAULT_STATE: AppState = {
  tonic: 'C',
  mode: 'major',
  chordKind: 'triads',
  chord: { source: 'key', degree: 1 },
  extensions: [],
  notation: 'letters',
  language: 'es',
}

// URL spelling of the non-default value of each two-valued setting.
const SEVENTHS = '7th'
const MODE_NAMES = new Set<string>(getParallelModes('C').map((mode) => mode.name))
const CHORD_PATTERN = /^([a-z]+)\.([1-7])$/
// Up to two of 9, 11, 13, comma-separated; repeats are rejected below.
const EXT_PATTERN = /^(9|11|13)(,(9|11|13))?$/

const isCircleKey = (tonic: string, mode: KeyMode) => {
  try {
    getKey(tonic, mode)
    return true
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}

const parseMode = (value: string | null): KeyMode => (value === 'minor' ? 'minor' : 'major')

const isChordSource = (source: string): source is ChordRef['source'] =>
  source === 'key' || MODE_NAMES.has(source)

const parseChord = (value: string | null): ChordRef => {
  const [, source, degree] = CHORD_PATTERN.exec(value ?? '') ?? []
  if (source === undefined || degree === undefined || !isChordSource(source)) {
    return DEFAULT_STATE.chord
  }
  return { source, degree: Number(degree) }
}

const parseExtensions = (value: string | null): Extension[] => {
  if (value === null || !EXT_PATTERN.test(value)) return []
  const extensions = value.split(',').map(Number) as Extension[]
  if (new Set(extensions).size !== extensions.length) return []
  return extensions.sort((a, b) => a - b)
}

/**
 * Reads the state from a query string (`location.search`, with or without `?`). Each invalid
 * or missing parameter falls back to its own default; the valid ones are kept. A tonic that is
 * not on the circle for the parsed mode falls back to C.
 */
export function parseState(search: string): AppState {
  const params = new URLSearchParams(search)
  const mode = parseMode(params.get('mode'))
  const tonic = params.get('key') ?? DEFAULT_STATE.tonic
  return {
    tonic: isCircleKey(tonic, mode) ? tonic : DEFAULT_STATE.tonic,
    mode,
    chordKind: params.get('chords') === SEVENTHS ? 'sevenths' : 'triads',
    chord: parseChord(params.get('chord')),
    extensions: parseExtensions(params.get('ext')),
    notation: params.get('names') === 'solfege' ? 'solfege' : 'letters',
    language: params.get('lang') === 'en' ? 'en' : 'es',
  }
}

/** Writes the state as a query string (`''` or `?…`), omitting every default. */
export function serializeState(state: AppState): string {
  const params = new URLSearchParams()
  if (state.tonic !== DEFAULT_STATE.tonic) params.set('key', state.tonic)
  if (state.mode !== DEFAULT_STATE.mode) params.set('mode', state.mode)
  if (state.chordKind !== DEFAULT_STATE.chordKind) params.set('chords', SEVENTHS)
  const { source, degree } = state.chord
  if (source !== DEFAULT_STATE.chord.source || degree !== DEFAULT_STATE.chord.degree) {
    params.set('chord', `${source}.${degree}`)
  }
  if (state.extensions.length > 0) {
    params.set('ext', [...state.extensions].sort((a, b) => a - b).join(','))
  }
  if (state.notation !== DEFAULT_STATE.notation) params.set('names', state.notation)
  if (state.language !== DEFAULT_STATE.language) params.set('lang', state.language)
  const query = params.toString()
  return query === '' ? '' : `?${query}`
}
