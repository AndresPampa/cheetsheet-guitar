import { describe, expect, it } from 'vitest'
import { resolveStep, SUGGESTED_PROGRESSIONS, type KeyMode, type ProgressionStep } from './index.ts'

// ORACLE — every expected value below was written and verified by hand (degrees of the key or
// of the parallel mode, spelled by letter). NEVER regenerate these by calling tonal.

const triad = (source: ProgressionStep['source'], degree: number): ProgressionStep => ({
  source,
  degree,
  kind: 'triads',
  extensions: [],
})

/** `roman symbol` of each step, as the progression shows it. */
const show = (tonic: string, mode: KeyMode, steps: ProgressionStep[]) =>
  steps.map((step) => {
    const { roman, symbol } = resolveStep(tonic, mode, step)
    return `${roman} ${symbol}`
  })

interface Case {
  tonic: string
  mode: KeyMode
  expected: string[]
}

const I_VI_IV_V = [triad('key', 1), triad('key', 6), triad('key', 4), triad('key', 5)]

const KEY_CASES: Case[] = [
  { tonic: 'C', mode: 'major', expected: ['I C', 'vi Am', 'IV F', 'V G'] },
  { tonic: 'G', mode: 'major', expected: ['I G', 'vi Em', 'IV C', 'V D'] },
  { tonic: 'A', mode: 'minor', expected: ['i Am', 'VI F', 'iv Dm', 'v Em'] },
]

const MODAL_CASES: Case[] = [
  { tonic: 'C', mode: 'major', expected: ['bVII Bb', 'I7 C7'] },
  { tonic: 'G', mode: 'major', expected: ['bVII F', 'I7 G7'] },
  { tonic: 'A', mode: 'minor', expected: ['bVII G', 'I7 A7'] },
]

describe('resolveStep', () => {
  it.each(KEY_CASES)(
    'follows the key and its mode for key steps in $tonic $mode',
    ({ tonic, mode, expected }) => {
      expect(show(tonic, mode, I_VI_IV_V)).toEqual(expected)
    },
  )

  it('applies the step kind and extensions, not the global ones', () => {
    const step: ProgressionStep = { source: 'key', degree: 5, kind: 'sevenths', extensions: [9] }

    const major = resolveStep('C', 'major', step)
    const minor = resolveStep('A', 'minor', step)

    expect(major).toMatchObject({ roman: 'V7', symbol: 'G9', notes: ['G', 'B', 'D', 'F', 'A'] })
    expect(minor).toMatchObject({
      roman: 'v7',
      symbol: 'Em7(b9)',
      notes: ['E', 'G', 'B', 'D', 'F'],
    })
  })

  it('uses the key panel roman for the third degree in minor and the table roman for aeolian', () => {
    expect(show('A', 'minor', [triad('key', 3), triad('aeolian', 3)])).toEqual(['III C', 'bIII C'])
  })

  it('gives the triad family as the quality, also for seventh steps', () => {
    const sevenths = (source: ProgressionStep['source'], degree: number): ProgressionStep => ({
      source,
      degree,
      kind: 'sevenths',
      extensions: [],
    })

    const resolved = [
      sevenths('key', 5),
      sevenths('key', 7),
      sevenths('harmonic-minor', 1),
      sevenths('ionian-sharp5', 1),
    ].map((step) => {
      const { symbol, quality } = resolveStep('C', 'major', step)
      return `${symbol} ${quality}`
    })

    expect(resolved).toEqual(['G7 major', 'Bm7b5 diminished', 'CmMaj7 minor', 'Cmaj7#5 augmented'])
  })

  it.each(MODAL_CASES)(
    'follows only the root for modal steps in $tonic $mode, in their own parent scale',
    ({ tonic, mode, expected }) => {
      const steps: ProgressionStep[] = [
        triad('mixolydian', 7),
        { source: 'phrygian-dominant', degree: 1, kind: 'sevenths', extensions: [] },
      ]

      expect(show(tonic, mode, steps)).toEqual(expected)
    },
  )
})
// Spec chord-progression, "Progresiones sugeridas". ORACLE written by hand: explicit modes, so
// A minor keeps the character (a 'key' step would give other chords in every one of them).
describe('SUGGESTED_PROGRESSIONS', () => {
  const symbols = (tonic: string, mode: KeyMode, steps: ProgressionStep[]) =>
    steps.map((step) => resolveStep(tonic, mode, step).symbol)

  const IN_C_MAJOR: Array<[string, string[]]> = [
    ['pop', ['C', 'G', 'Am', 'F']],
    ['ii-V-I', ['Dm7', 'G7', 'Cmaj7']],
    ['turnaround', ['C', 'Am', 'Dm', 'G']],
    ['andalusian', ['Cm', 'Bb', 'Ab', 'G']],
    ['mixolydian', ['C', 'Bb', 'F']],
    ['blues', ['C7', 'C7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7']],
  ]

  const IN_A_MINOR: Array<[string, string[]]> = [
    ['pop', ['A', 'E', 'F#m', 'D']],
    ['ii-V-I', ['Bm7', 'E7', 'Amaj7']],
    ['turnaround', ['A', 'F#m', 'Bm', 'E']],
    ['andalusian', ['Am', 'G', 'F', 'E']],
    ['mixolydian', ['A', 'G', 'D']],
    ['blues', ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7']],
  ]

  it('lists the six suggestions in order', () => {
    expect(SUGGESTED_PROGRESSIONS.map(({ id }) => id)).toEqual(IN_C_MAJOR.map(([id]) => id))
  })

  it.each(IN_C_MAJOR)('resolves %s in C major', (id, expected) => {
    const { steps } = SUGGESTED_PROGRESSIONS.find((suggestion) => suggestion.id === id)!

    expect(symbols('C', 'major', steps)).toEqual(expected)
  })

  it.each(IN_A_MINOR)('keeps the character of %s in A minor', (id, expected) => {
    const { steps } = SUGGESTED_PROGRESSIONS.find((suggestion) => suggestion.id === id)!

    expect(symbols('A', 'minor', steps)).toEqual(expected)
  })

  it('uses the romans of the andalusian cadence and of the blues', () => {
    const romans = (id: string) =>
      SUGGESTED_PROGRESSIONS.find((suggestion) => suggestion.id === id)!.steps.map(
        (step) => resolveStep('C', 'major', step).roman,
      )

    expect(romans('andalusian')).toEqual(['i', 'bVII', 'bVI', 'V'])
    expect(romans('blues')).toEqual([
      'I7',
      'I7',
      'I7',
      'I7',
      'IV7',
      'IV7',
      'I7',
      'I7',
      'V7',
      'IV7',
      'I7',
      'V7',
    ])
  })
})
