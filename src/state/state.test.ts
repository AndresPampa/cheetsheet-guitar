import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, parseState, serializeState, type AppState } from './index.ts'

const FULL_STATE: AppState = {
  tonic: 'F#',
  mode: 'minor',
  chordKind: 'sevenths',
  chord: { source: 'dorian', degree: 4 },
  notation: 'solfege',
  language: 'en',
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
