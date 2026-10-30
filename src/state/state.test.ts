import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, parseState, serializeState, type AppState } from './index.ts'

const FULL_STATE: AppState = {
  tonic: 'F#',
  mode: 'minor',
  chordKind: 'sevenths',
  chord: { source: 'dorian', degree: 4 },
  notation: 'solfege',
  language: 'en',
  extensions: [],
  scale: 'major',
}
const FULL_SEARCH = '?key=F%23&mode=minor&chords=7th&chord=dorian.4&names=solfege&lang=en'

describe('parseState', () => {
  it('returns C major, triads, the I chord, C D E and Spanish when the URL has no parameters', () => {
    expect(parseState('')).toEqual({
      tonic: 'C',
      mode: 'major',
      chordKind: 'triads',
      chord: { source: 'key', degree: 1 },
      notation: 'letters',
      language: 'es',
      extensions: [],
      scale: 'major',
    })
    expect(DEFAULT_STATE).toEqual(parseState(''))
  })

  it('reads every parameter when all of them are set', () => {
    expect(parseState(FULL_SEARCH)).toEqual(FULL_STATE)
  })

  it('reads a query string without the leading question mark', () => {
    expect(parseState('key=Bb&chord=key.5')).toEqual({
      ...DEFAULT_STATE,
      tonic: 'Bb',
      chord: { source: 'key', degree: 5 },
    })
  })

  it('accepts default values written explicitly', () => {
    expect(parseState('?key=C&mode=major&chord=key.1')).toEqual(DEFAULT_STATE)
  })

  it('reads a flat minor key as written', () => {
    expect(parseState('?key=Eb&mode=minor')).toEqual({
      ...DEFAULT_STATE,
      tonic: 'Eb',
      mode: 'minor',
    })
  })

  describe('invalid parameters fall back one by one, keeping the valid ones', () => {
    const cases: Array<[string, string, Partial<AppState>]> = [
      ['an unknown note', '?key=H&chords=7th', { chordKind: 'sevenths' }],
      ['a tonic outside the circle', '?key=B%23&lang=en', { language: 'en' }],
      ['a minor-only tonic in a major key', '?key=A%23', {}],
      ['a lowercase tonic', '?key=g', {}],
      ['an unknown mode, keeping a major tonic', '?key=G&mode=dorian', { tonic: 'G' }],
      ['an unknown mode with a minor-only tonic', '?key=A%23&mode=phrygian', {}],
      ['an unknown chord kind', '?key=D&chords=9th', { tonic: 'D' }],
      ['a chord without a degree', '?key=G&chord=xyz', { tonic: 'G' }],
      ['a chord with an unknown source', '?chord=blues.3', {}],
      ['a chord degree below 1', '?chord=key.0', {}],
      ['a chord degree above 7', '?chord=lydian.8', {}],
      ['a fractional chord degree', '?chord=key.2.5', {}],
      ['a padded chord degree', '?chord=key.03', {}],
      ['an unknown note naming', '?names=german&lang=en', { language: 'en' }],
      ['an unknown language', '?lang=fr&names=solfege', { notation: 'solfege' }],
      // Hostile input (v1.5, public deploy): anything outside the allowlists is just invalid.
      [
        'markup in the key',
        '?key=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&lang=en',
        { language: 'en' },
      ],
      ['a prototype name as the key', '?key=__proto__&mode=minor', { mode: 'minor' }],
      ['a prototype name as the chord source', '?chord=constructor.1', {}],
      ['a script URL as the language', '?lang=javascript:alert(1)', {}],
      ['a language that only starts like English', '?lang=eng', {}],
      ['a language cut short', '?lang=e', {}],
      ['a 10 000-character key', `?key=${'C'.repeat(10_000)}`, {}],
    ]

    it.each(cases)('ignores %s', (_, search, kept) => {
      expect(parseState(search)).toEqual({ ...DEFAULT_STATE, ...kept })
    })
  })

  it('opens a chord from any of the seven parallel modes', () => {
    expect(parseState('?chord=ionian.1').chord).toEqual({ source: 'ionian', degree: 1 })
    expect(parseState('?chord=locrian.7').chord).toEqual({ source: 'locrian', degree: 7 })
  })
})

describe('serializeState', () => {
  it('writes an empty query when everything is at its default', () => {
    expect(serializeState(DEFAULT_STATE)).toBe('')
  })

  it('writes every parameter, with the sharp percent-encoded, when none is at its default', () => {
    expect(serializeState(FULL_STATE)).toBe(FULL_SEARCH)
  })

  it('writes only the parameters that differ from the default', () => {
    expect(
      serializeState({ ...DEFAULT_STATE, tonic: 'Ab', chord: { source: 'key', degree: 6 } }),
    ).toBe('?key=Ab&chord=key.6')
    expect(serializeState({ ...DEFAULT_STATE, mode: 'minor', tonic: 'A' })).toBe(
      '?key=A&mode=minor',
    )
  })

  it("writes the chord on degree 1 of a mode, since only the key's I is the default", () => {
    expect(serializeState({ ...DEFAULT_STATE, chord: { source: 'dorian', degree: 1 } })).toBe(
      '?chord=dorian.1',
    )
  })

  it('keeps C in the URL for C minor, since only the major tonic is the default', () => {
    expect(serializeState({ ...DEFAULT_STATE, mode: 'minor' })).toBe('?mode=minor')
  })

  const roundTrips: AppState[] = [
    FULL_STATE,
    { ...DEFAULT_STATE, tonic: 'Gb', chord: { source: 'mixolydian', degree: 7 } },
    { ...DEFAULT_STATE, tonic: 'D#', mode: 'minor', notation: 'solfege' },
  ]

  it.each(roundTrips)('reads back what it writes for $tonic $mode', (state) => {
    expect(parseState(serializeState(state))).toEqual(state)
  })
})

describe('extensions in the URL', () => {
  const validCases: Array<[string, Partial<AppState>]> = [
    ['?ext=9,13', { extensions: [9, 13] }],
    ['?ext=11', { extensions: [11] }],
    ['?key=G&ext=13', { tonic: 'G', extensions: [13] }],
    ['?key=G', { tonic: 'G', extensions: [] }],
  ]

  it.each(validCases)('reads %s, with an empty list when ext is absent', (search, expected) => {
    expect(parseState(search)).toEqual({ ...DEFAULT_STATE, ...expected })
  })

  const invalidCases: Array<[string, string]> = [
    ['more than two', '?key=G&ext=9,11,13'],
    ['a repeated one', '?key=G&ext=9,9'],
    ['a value outside 9, 11, 13', '?key=G&ext=7'],
    ['a non-numeric value', '?key=G&ext=9,x'],
    ['an empty value', '?key=G&ext='],
    ['an empty item', '?key=G&ext=9,,13'],
  ]

  it.each(invalidCases)('falls back to no extensions on %s, keeping the key', (_, search) => {
    expect(parseState(search)).toEqual({ ...DEFAULT_STATE, tonic: 'G', extensions: [] })
  })

  it('reads extensions sorted from lowest to highest when the URL has them out of order', () => {
    expect(parseState('?ext=13,9').extensions).toEqual([9, 13])
  })

  it('writes extensions sorted and reads them back when the state has them out of order', () => {
    const search = serializeState({ ...DEFAULT_STATE, extensions: [13, 9] })

    expect(['?ext=9%2C13', '?ext=9,13']).toContain(search)
    expect(parseState(search).extensions).toEqual([9, 13])
  })

  it('omits ext when there are no extensions', () => {
    expect(serializeState({ ...DEFAULT_STATE, extensions: [] })).not.toContain('ext')
  })
})

describe('parent scale in the URL', () => {
  const scales: Array<[string, Partial<AppState>]> = [
    ['?scale=harmonic', { scale: 'harmonic' }],
    ['?key=G', { tonic: 'G', scale: 'major' }],
    ['?key=G&scale=dorian', { tonic: 'G', scale: 'major' }],
    ['?key=G&scale=', { tonic: 'G', scale: 'major' }],
  ]

  it.each(scales)('reads %s, falling back to major when absent or invalid', (search, expected) => {
    expect(parseState(search)).toEqual({ ...DEFAULT_STATE, ...expected })
  })

  it('writes and reads back a chord of a harmonic-minor mode', () => {
    const state: AppState = {
      ...DEFAULT_STATE,
      scale: 'harmonic',
      chord: { source: 'phrygian-dominant', degree: 1 },
    }

    const search = serializeState(state)

    expect(search).toBe('?chord=phrygian-dominant.1&scale=harmonic')
    expect(parseState(search)).toEqual(state)
  })

  it('omits scale when it is major', () => {
    expect(serializeState(DEFAULT_STATE)).toBe('')
  })

  const outsideScale: Array<[string, string]> = [
    ['a harmonic-minor mode with the major scale', '?chord=phrygian-dominant.1'],
    ['a major mode with the harmonic minor', '?scale=harmonic&chord=dorian.4'],
  ]

  it.each(outsideScale)('falls back to the I of the key for %s', (_, search) => {
    expect(parseState(search).chord).toEqual({ source: 'key', degree: 1 })
  })

  it('keeps a key chord or a mode of the chosen scale', () => {
    expect(parseState('?scale=harmonic&chord=key.5').chord).toEqual({ source: 'key', degree: 5 })
    expect(parseState('?scale=harmonic&chord=locrian-nat6.4').chord).toEqual({
      source: 'locrian-nat6',
      degree: 4,
    })
  })
})
