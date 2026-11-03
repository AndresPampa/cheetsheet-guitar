import { describe, expect, it } from 'vitest'
import { resolveStep, type KeyMode, type ProgressionStep } from './index.ts'

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
