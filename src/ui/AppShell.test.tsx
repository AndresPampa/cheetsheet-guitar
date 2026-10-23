import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadVoicings, type Voicing } from '../voicings/index.ts'
import { AppShell } from './AppShell.tsx'

// Fakes at the three boundaries. Real Tone.js and svguitar never run in jsdom (no audio, no
// getBBox). Voicings stay pending unless a test asks for the real data.
type Services = ComponentProps<typeof AppShell>
const services: Services = {
  audio: { playChord: () => {} },
  voicings: () => new Promise<never>(() => {}),
  drawDiagram: () => {},
}
const renderShell = (overrides: Partial<Services> = {}) =>
  render(<AppShell {...services} {...overrides} />)
const keyPanel = () => screen.getByRole('region', { name: 'Tonalidad seleccionada' })
const chordList = () =>
  within(keyPanel())
    .getAllByRole('listitem')
    .map((item) => item.textContent)

describe('AppShell', () => {
  // The explorer reads and rewrites the URL: every test starts from a clean one.
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('draws 12 major and 12 minor sectors', () => {
    renderShell()

    expect(screen.getAllByRole('radio', { name: /mayor/ })).toHaveLength(12)
    expect(screen.getAllByRole('radio', { name: /menor/ })).toHaveLength(12)
    // The diminished ring is chords, not keys: it adds no radios.
    expect(screen.getAllByRole('radio')).toHaveLength(24)
  })

  it('orders the panels as they are laid out: circle, chord, then the full-width modes table', () => {
    renderShell()

    const panelNames = screen
      .getAllByRole('region')
      .map((region) => region.getAttribute('aria-label'))
      .filter((name) => name !== 'Tonalidad seleccionada')
    expect(panelNames).toEqual(['Círculo de quintas', 'Acorde seleccionado', 'Modos'])
  })

  it('names the enharmonic sectors with both spellings', () => {
    renderShell()

    expect(screen.getByRole('radio', { name: /^B o C bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^D bemol o C sostenido mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^D sostenido o E bemol menor/ })).toBeInTheDocument()
  })

  it('starts on C major with its diatonic triads', () => {
    renderShell()

    expect(screen.getByRole('radio', { name: /^C mayor/ })).toBeChecked()
    expect(within(keyPanel()).getByRole('heading', { name: 'C mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: sin alteraciones')).toBeInTheDocument()
    expect(chordList()).toEqual(['I C', 'ii Dm', 'iii Em', 'IV F', 'V G', 'vi Am', 'vii° B°'])
  })

  it('selects a major key on click and shows its chords and signature', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    expect(screen.getByRole('radio', { name: /^G mayor/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^C mayor/ })).not.toBeChecked()
    expect(within(keyPanel()).getByRole('heading', { name: 'G mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: 1 sostenido (F♯)')).toBeInTheDocument()
    expect(chordList()).toEqual(['I G', 'ii Am', 'iii Bm', 'IV C', 'V D', 'vi Em', 'vii° F♯°'])
  })

  it('marks the diatonic sectors of the selected key with their degree', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    expect(screen.getByRole('radio', { name: 'G mayor, grado I, 1 sostenido' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'C mayor, grado IV' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'D mayor, grado V' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'A menor, grado ii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B menor, grado iii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'E menor, grado vi' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'F mayor, 1 bemol' })).toBeInTheDocument()
  })

  // PRD story 12, decided with the user 2026-10-22: free sectors and the I announce the key
  // signature; the other diatonic sectors announce only their chord role (their key spelling
  // may differ from the sector's, e.g. G# major's signature on the Ab sector).
  describe('key signature in the sector names', () => {
    it('names each free sector with the signature of its spellings', () => {
      renderShell()

      expect(screen.getByRole('radio', { name: 'E bemol mayor, 3 bemoles' })).toBeInTheDocument()
      expect(
        screen.getByRole('radio', { name: 'B o C bemol mayor, 5 sostenidos o 7 bemoles' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('radio', {
          name: 'D sostenido o E bemol menor, 6 sostenidos o 6 bemoles',
        }),
      ).toBeInTheDocument()
    })

    it('names the tonic sector with the signature of the selected key', async () => {
      const user = userEvent.setup()
      renderShell()

      expect(
        screen.getByRole('radio', { name: 'C mayor, grado I, sin alteraciones' }),
      ).toBeChecked()

      await user.click(screen.getByRole('radio', { name: /^E menor/ }))

      expect(screen.getByRole('radio', { name: 'E menor, grado i, 1 sostenido' })).toBeChecked()
    })

    it('names the tonic sector with the chosen enharmonic spelling', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^D bemol o C sostenido mayor/ }))
      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como C♯ mayor' }))

      expect(
        screen.getByRole('radio', { name: 'C sostenido mayor, grado I, 7 sostenidos' }),
      ).toBeChecked()
    })

    it('names the sectors in English with the language switch', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('button', { name: 'English' }))

      expect(screen.getByRole('radio', { name: 'C major, degree I, no accidentals' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'A major, 3 sharps' })).toBeInTheDocument()
    })
  })

  it('marks the diminished chord on the innermost ring, not on a minor key', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    const circle = screen.getByRole('radiogroup', { name: 'Tonalidades' })
    expect(within(circle).getByText('F♯°').closest('g')).toHaveClass('is-diatonic')
    expect(within(circle).getByText('vii°')).toBeInTheDocument()
    // A diminished chord outside the key keeps both spellings and no highlight.
    expect(within(circle).getByText('A♯°').closest('g')).not.toHaveClass('is-diatonic')
    expect(within(circle).getByText('B♭°')).toBeInTheDocument()
    // The F#m key sector is still a plain key, not the diminished chord.
    expect(
      screen.getByRole('radio', { name: 'F sostenido menor, 3 sostenidos' }),
    ).toBeInTheDocument()
  })

  it('selects a minor key from the inner ring with minor-key numerals', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^E menor/ }))

    expect(within(keyPanel()).getByRole('heading', { name: 'E menor' })).toBeInTheDocument()
    expect(chordList()).toEqual(['i Em', 'ii° F♯°', 'III G', 'iv Am', 'v Bm', 'VI C', 'VII D'])
  })

  it('uses the singular for a one-flat signature', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^F mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 1 bemol (B♭)')).toBeInTheDocument()
  })

  it('lists flats in canonical order in the signature', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole('radio', { name: /^E bemol mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 3 bemoles (B♭ E♭ A♭)')).toBeInTheDocument()
  })

  describe('triads / sevenths switch', () => {
    const triadsButton = () => within(keyPanel()).getByRole('button', { name: 'Triadas' })
    const seventhsButton = () => within(keyPanel()).getByRole('button', { name: 'Séptimas' })

    it('starts on triads', () => {
      renderShell()

      expect(triadsButton()).toHaveAttribute('aria-pressed', 'true')
      expect(seventhsButton()).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows the diatonic seventh chords when switched to sevenths', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(seventhsButton())

      expect(seventhsButton()).toHaveAttribute('aria-pressed', 'true')
      expect(triadsButton()).toHaveAttribute('aria-pressed', 'false')
      expect(chordList()).toEqual([
        'Imaj7 Cmaj7',
        'ii7 Dm7',
        'iii7 Em7',
        'IVmaj7 Fmaj7',
        'V7 G7',
        'vi7 Am7',
        'viiø7 Bm7b5',
      ])
    })

    it('keeps sevenths when another key is selected', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(seventhsButton())

      await user.click(screen.getByRole('radio', { name: /^E menor/ }))

      expect(chordList()).toEqual([
        'i7 Em7',
        'iiø7 F♯m7b5',
        'IIImaj7 Gmaj7',
        'iv7 Am7',
        'v7 Bm7',
        'VImaj7 Cmaj7',
        'VII7 D7',
      ])
    })

    it('keeps sevenths when the key is respelled', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(seventhsButton())
      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' }))

      expect(chordList()).toEqual([
        'Imaj7 G♭maj7',
        'ii7 A♭m7',
        'iii7 B♭m7',
        'IVmaj7 C♭maj7',
        'V7 D♭7',
        'vi7 E♭m7',
        'viiø7 Fm7b5',
      ])
    })

    it('goes back to triads', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(seventhsButton())

      await user.click(triadsButton())

      expect(chordList()).toEqual(['I C', 'ii Dm', 'iii Em', 'IV F', 'V G', 'vi Am', 'vii° B°'])
    })

    it('leaves the circle labelled with triads', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(seventhsButton())

      expect(screen.getByRole('radio', { name: 'G mayor, grado V' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'D menor, grado ii' })).toBeInTheDocument()
    })
  })

  describe('parallel modes table', () => {
    const modesTable = () => screen.getByRole('table', { name: /^Modos paralelos de/ })
    const modeRow = (name: string) =>
      within(modesTable()).getByRole('row', { name: new RegExp(`^${name}`) })
    // What a screen reader announces per degree: roman, chord, ⭐ and the hidden flags.
    const degreesOf = (name: string) =>
      within(modeRow(name))
        .getAllByRole('cell')
        .slice(1)
        .map((cell) => cell.textContent)
    const characteristicOf = (name: string) => within(modeRow(name)).getAllByRole('cell')[0]

    it('lists the seven parallel modes of the selected root in order', () => {
      renderShell()

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de C')
      expect(
        within(modesTable())
          .getAllByRole('rowheader')
          .map((header) => header.firstChild?.textContent),
      ).toEqual(['Jónico', 'Dórico', 'Frigio', 'Lidio', 'Mixolidio', 'Eólico', 'Locrio'])
    })

    it('shows each mode with its scale and characteristic note', () => {
      renderShell()

      expect(modeRow('Dórico')).toHaveTextContent('C D E♭ F G A B♭')
      expect(characteristicOf('Dórico')).toHaveTextContent('6ª mayor (A)')
      expect(characteristicOf('Frigio')).toHaveTextContent('♭2 (D♭)')
      expect(characteristicOf('Lidio')).toHaveTextContent('♯4 (F♯)')
      expect(characteristicOf('Jónico')).toHaveTextContent('—')
    })

    it('marks characteristic, borrowed and starred chords on each degree', () => {
      renderShell()

      expect(degreesOf('Dórico')).toEqual([
        'i Cm (prestado)',
        'ii Dm (característica)',
        '♭III E♭ (prestado)',
        'IV F ⭐ (más representativo) (característica)',
        'v Gm (prestado)',
        'vi° A° (característica) (prestado)',
        '♭VII B♭ (prestado)',
      ])
      expect(degreesOf('Jónico')).toEqual([
        'I C',
        'ii Dm',
        'iii Em',
        'IV F',
        'V G',
        'vi Am',
        'vii° B°',
      ])
    })

    it('shows each degree and its chord as separate lines, like the key panel chips', () => {
      renderShell()
      const cell = within(modeRow('Dórico')).getAllByRole('cell')[7]!

      expect(within(cell).getByText('♭VII')).toHaveClass('chord-roman')
      expect(within(cell).getByText('B♭')).toHaveClass('chord-symbol')
    })

    it('writes raised degrees with a sharp sign (lydian)', () => {
      renderShell()

      expect(degreesOf('Lidio')).toEqual([
        'I C',
        'II D ⭐ (más representativo) (característica) (prestado)',
        'iii Em',
        '♯iv° F♯° (característica) (prestado)',
        'V G',
        'vi Am',
        'vii Bm (característica) (prestado)',
      ])
    })

    // jsdom computes no styles: the classes are the visual cue sighted users get, and they
    // must match the hidden flags (and follow the switch) instead of drifting from them.
    it('draws the visual cues for characteristic and borrowed chords', async () => {
      const user = userEvent.setup()
      renderShell()
      const cells = () => within(modeRow('Dórico')).getAllByRole('cell')

      expect(cells()[1]).toHaveClass('is-borrowed')
      expect(cells()[1]).not.toHaveClass('has-characteristic')
      expect(cells()[4]).toHaveClass('has-characteristic')
      expect(cells()[4]).not.toHaveClass('is-borrowed')

      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))

      // F is shared with ionian, but F7 is not Fmaj7.
      expect(cells()[4]).toHaveClass('has-characteristic', 'is-borrowed')
    })

    it('follows the circle to the root of the selected minor key', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^A menor/ }))

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de A')
      expect(degreesOf('Eólico')).toEqual([
        'i Am (prestado)',
        'ii° B° (característica) (prestado)',
        '♭III C (prestado)',
        'iv Dm ⭐ (más representativo) (característica) (prestado)',
        'v Em (prestado)',
        '♭VI F ⭐ (más representativo) (característica) (prestado)',
        '♭VII G (prestado)',
      ])
    })

    it('follows the respelled root', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' }))

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de G♭')
      expect(modeRow('Locrio')).toHaveTextContent('G♭ A♭♭ B♭♭ C♭ D♭♭ E♭♭ F♭')
    })

    it('follows the triads / sevenths switch', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))

      expect(degreesOf('Mixolidio')).toEqual([
        'I7 C7 (característica) (prestado)',
        'ii7 Dm7',
        'iiiø7 Em7b5 (característica) (prestado)',
        'IVmaj7 Fmaj7',
        'v7 Gm7 (característica) (prestado)',
        'vi7 Am7',
        '♭VIImaj7 B♭maj7 ⭐ (más representativo) (característica) (prestado)',
      ])
    })
  })

  describe('chord panel', () => {
    // Fake at the audio boundary: records what was asked to sound, plays nothing.
    const fakeAudio = () => {
      const played: string[][] = []
      return { played, audio: { playChord: (notes: string[]) => void played.push(notes) } }
    }
    const chordPanel = () => screen.getByRole('region', { name: 'Acorde seleccionado' })
    const modesWithChord = () =>
      within(within(chordPanel()).getByRole('list', { name: 'Modos donde aparece' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent)

    it('starts on the tonic chord of C major, silently', () => {
      const { played, audio } = fakeAudio()
      renderShell({ audio })

      expect(within(chordPanel()).getByRole('heading', { name: 'C' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado I · C mayor')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: C E G')).toBeInTheDocument()
      expect(modesWithChord()).toEqual(['Jónico I', 'Lidio I', 'Mixolidio I'])
      expect(played).toEqual([])
    })

    it('loads the tonic of a key picked on the circle without playing it', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })
      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))

      await user.click(screen.getByRole('radio', { name: /^A menor/ }))

      expect(within(chordPanel()).getByRole('heading', { name: 'Am' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado i · A menor')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: A C E')).toBeInTheDocument()
      expect(played).toEqual([['F', 'A', 'C']])
    })

    it('loads the tonic of the respelled key without playing it', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })
      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))
      await user.click(within(keyPanel()).getByRole('button', { name: 'V C♯' }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' }))

      expect(within(chordPanel()).getByRole('heading', { name: 'G♭' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado I · G♭ mayor')).toBeInTheDocument()
      expect(played).toEqual([['C#', 'E#', 'G#']])
    })

    it('opens a modes-table chord as a seventh when sevenths are on', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })
      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))
      const table = screen.getByRole('table', { name: /^Modos paralelos de/ })
      const dorian = within(table).getByRole('row', { name: /^Dórico/ })

      await user.click(within(dorian).getByRole('button', { name: /^IV7 F7/ }))

      expect(within(chordPanel()).getByRole('heading', { name: 'F7' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado IV7 · C dórico')).toBeInTheDocument()
      expect(modesWithChord()).toEqual(['Dórico IV7 ⭐ (más representativo)'])
      expect(played).toEqual([['F', 'A', 'C', 'Eb']])
    })

    // The key panel names minor-key degrees against the key itself (III); the modes list names
    // them against the major scale of the root (♭III).
    it('opens a chord of a minor key with both numberings', async () => {
      const user = userEvent.setup()
      const { audio } = fakeAudio()
      renderShell({ audio })
      await user.click(screen.getByRole('radio', { name: /^A menor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'III C' }))

      expect(within(chordPanel()).getByText('Grado III · A menor')).toBeInTheDocument()
      expect(modesWithChord()).toEqual(['Dórico ♭III', 'Frigio ♭III', 'Eólico ♭III'])
    })

    it('opens and plays a chord clicked in the key panel', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })

      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))

      expect(within(chordPanel()).getByRole('heading', { name: 'F' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado IV · C mayor')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: F A C')).toBeInTheDocument()
      expect(modesWithChord()).toEqual([
        'Jónico IV',
        'Dórico IV ⭐ (más representativo)',
        'Mixolidio IV',
      ])
      expect(played).toEqual([['F', 'A', 'C']])

      await user.click(within(chordPanel()).getByRole('button', { name: 'Escuchar F' }))

      expect(played).toEqual([
        ['F', 'A', 'C'],
        ['F', 'A', 'C'],
      ])
    })

    it('opens and plays a chord clicked in the modes table', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })
      const table = screen.getByRole('table', { name: /^Modos paralelos de/ })
      const dorian = within(table).getByRole('row', { name: /^Dórico/ })

      await user.click(within(dorian).getByRole('button', { name: /^♭VII B♭/ }))

      expect(within(chordPanel()).getByRole('heading', { name: 'B♭' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado ♭VII · C dórico')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: B♭ D F')).toBeInTheDocument()
      expect(modesWithChord()).toEqual([
        'Dórico ♭VII',
        'Mixolidio ♭VII ⭐ (más representativo)',
        'Eólico ♭VII',
      ])
      expect(played).toEqual([['Bb', 'D', 'F']])
    })

    it('replays the chord with the play button', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })

      await user.click(within(chordPanel()).getByRole('button', { name: 'Escuchar C' }))

      expect(played).toEqual([['C', 'E', 'G']])
    })

    it('follows the triads / sevenths switch for the open chord', async () => {
      const user = userEvent.setup()
      const { played, audio } = fakeAudio()
      renderShell({ audio })
      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))
      await user.click(within(chordPanel()).getByRole('button', { name: 'Escuchar Fmaj7' }))

      expect(within(chordPanel()).getByRole('heading', { name: 'Fmaj7' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado IVmaj7 · C mayor')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: F A C E')).toBeInTheDocument()
      expect(modesWithChord()).toEqual(['Jónico IVmaj7', 'Mixolidio IVmaj7'])
      expect(played).toEqual([
        ['F', 'A', 'C'],
        ['F', 'A', 'C', 'E'],
      ])
    })
  })

  describe('chord diagram', () => {
    const C_SHAPE: Voicing = {
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
      baseFret: 1,
      barres: [],
    }
    const F_SHAPE: Voicing = {
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      baseFret: 1,
      barres: [1],
    }
    const chordPanel = () => screen.getByRole('region', { name: 'Acorde seleccionado' })
    // Real voicing data; the drawing itself is faked (svguitar needs a real SVG layout).
    const withDiagrams = () => {
      const drawn: number[][] = []
      return {
        drawn,
        voicings: loadVoicings,
        drawDiagram: (_container: HTMLElement, voicing: { frets: number[] }) =>
          void drawn.push(voicing.frets),
      }
    }

    it('shows the most common position of the open chord', async () => {
      const { drawn, ...diagrams } = withDiagrams()
      renderShell(diagrams)

      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de C: cuerdas de 6ª a 1ª x 3 2 0 1 0',
        }),
      ).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Posición 1 de 4')).toBeInTheDocument()
      expect(drawn.at(-1)).toEqual([-1, 3, 2, 0, 1, 0])
    })

    it('steps through the other positions and back', async () => {
      const user = userEvent.setup()
      const { drawn, ...diagrams } = withDiagrams()
      renderShell(diagrams)
      const previous = await within(chordPanel()).findByRole('button', {
        name: 'Posición anterior',
      })
      // Unavailable but still focusable (aria-disabled), so keyboard focus is never lost.
      expect(previous).toHaveAttribute('aria-disabled', 'true')
      await user.click(previous)
      expect(within(chordPanel()).getByText('Posición 1 de 4')).toHaveAttribute(
        'aria-live',
        'polite',
      )

      await user.click(within(chordPanel()).getByRole('button', { name: 'Posición siguiente' }))

      expect(within(chordPanel()).getByText('Posición 2 de 4')).toBeInTheDocument()
      expect(
        within(chordPanel()).getByRole('img', {
          name: 'Diagrama de C: cuerdas de 6ª a 1ª 3 3 5 5 5 3, desde el traste 3',
        }),
      ).toBeInTheDocument()
      expect(drawn.at(-1)).toEqual([3, 3, 5, 5, 5, 3])

      await user.click(within(chordPanel()).getByRole('button', { name: 'Posición anterior' }))

      expect(within(chordPanel()).getByText('Posición 1 de 4')).toBeInTheDocument()
    })

    it('stops at the last position', async () => {
      const user = userEvent.setup()
      renderShell(withDiagrams())
      const next = await within(chordPanel()).findByRole('button', { name: 'Posición siguiente' })

      await user.click(next)
      await user.click(next)
      await user.click(next)
      await user.click(next)

      expect(within(chordPanel()).getByText('Posición 4 de 4')).toBeInTheDocument()
      expect(next).toHaveAttribute('aria-disabled', 'true')
      expect(next).toHaveFocus()
    })

    it('starts again at the first position for a newly opened chord', async () => {
      const user = userEvent.setup()
      renderShell(withDiagrams())
      await user.click(
        await within(chordPanel()).findByRole('button', { name: 'Posición siguiente' }),
      )

      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))

      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de F: cuerdas de 6ª a 1ª 1 3 3 2 1 1',
        }),
      ).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Posición 1 de 4')).toBeInTheDocument()
    })

    it('draws the seventh chord when sevenths are on', async () => {
      const user = userEvent.setup()
      renderShell(withDiagrams())

      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))

      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de Cmaj7: cuerdas de 6ª a 1ª 3 3 2 0 0 0',
        }),
      ).toBeInTheDocument()
    })

    it('says so when there is no diagram for the chord', async () => {
      renderShell({ voicings: () => Promise.resolve([]) })

      expect(
        await within(chordPanel()).findByText('No hay diagrama para este acorde'),
      ).toBeInTheDocument()
      expect(within(chordPanel()).queryByRole('img')).toBeNull()
    })

    it('says so when the diagram data cannot be loaded', async () => {
      renderShell({ voicings: () => Promise.reject(new Error('offline')) })

      expect(
        await within(chordPanel()).findByText('No se pudo cargar el diagrama'),
      ).toBeInTheDocument()
    })

    it('ignores a late answer for a chord that is no longer open', async () => {
      const user = userEvent.setup()
      const pending = new Map<string, (list: Voicing[]) => void>()
      renderShell({
        voicings: (root, quality) =>
          new Promise((resolve) => void pending.set(`${root} ${quality}`, resolve)),
      })

      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))
      pending.get('F major')!([F_SHAPE])
      pending.get('C major')!([C_SHAPE])

      expect(
        await within(chordPanel()).findByRole('img', { name: /^Diagrama de F:/ }),
      ).toBeInTheDocument()
    })

    it('ignores a late failure for a chord that is no longer open', async () => {
      const user = userEvent.setup()
      const pending = new Map<string, { resolve: (list: Voicing[]) => void; reject: () => void }>()
      renderShell({
        voicings: (root, quality) =>
          new Promise((resolve, reject) => {
            pending.set(`${root} ${quality}`, { resolve, reject: () => reject(new Error('late')) })
          }),
      })
      await user.click(within(keyPanel()).getByRole('button', { name: 'IV F' }))
      pending.get('F major')!.resolve([F_SHAPE])
      await within(chordPanel()).findByRole('img', { name: /^Diagrama de F:/ })

      await act(async () => pending.get('C major')!.reject())

      expect(within(chordPanel()).getByRole('img', { name: /^Diagrama de F:/ })).toBeInTheDocument()
    })

    it('draws the matching shape for minor and diminished triads', async () => {
      const user = userEvent.setup()
      renderShell(withDiagrams())

      await user.click(within(keyPanel()).getByRole('button', { name: 'ii Dm' }))
      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de Dm: cuerdas de 6ª a 1ª x x 0 2 3 1',
        }),
      ).toBeInTheDocument()

      await user.click(within(keyPanel()).getByRole('button', { name: 'vii° B°' }))
      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de B°: cuerdas de 6ª a 1ª x 2 0 x 0 1',
        }),
      ).toBeInTheDocument()
    })

    it('says the diagram is loading until the data arrives', () => {
      renderShell()

      expect(within(chordPanel()).getByText('Cargando diagrama…')).toBeInTheDocument()
    })
  })

  describe('enharmonic spelling', () => {
    it('uses the sharp spelling for F#/Gb and offers the flat one', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))

      expect(within(keyPanel()).getByRole('heading', { name: 'F♯ mayor' })).toBeInTheDocument()
      expect(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' })).toBeVisible()
    })

    it('respells the whole key when switching to the alternate spelling', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(screen.getByRole('radio', { name: /^D bemol o C sostenido mayor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como C♯ mayor' }))

      expect(within(keyPanel()).getByRole('heading', { name: 'C♯ mayor' })).toBeInTheDocument()
      expect(
        within(keyPanel()).getByText('Armadura: 7 sostenidos (F♯ C♯ G♯ D♯ A♯ E♯ B♯)'),
      ).toBeInTheDocument()
      expect(chordList()).toEqual([
        'I C♯',
        'ii D♯m',
        'iii E♯m',
        'IV F♯',
        'V G♯',
        'vi A♯m',
        'vii° B♯°',
      ])
      expect(
        screen.getByRole('radio', { name: 'C sostenido mayor, grado I, 7 sostenidos' }),
      ).toBeChecked()
      expect(within(keyPanel()).getByRole('button', { name: 'Ver como D♭ mayor' })).toBeVisible()
    })

    it('names the highlighted sectors with the spelling of the respelled key', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(screen.getByRole('radio', { name: /^D bemol o C sostenido mayor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como C♯ mayor' }))

      const circle = screen.getByRole('radiogroup', { name: 'Tonalidades' })
      expect(screen.getByRole('radio', { name: 'G sostenido mayor, grado V' })).toBeInTheDocument()
      expect(
        screen.getByRole('radio', { name: 'E sostenido menor, grado iii' }),
      ).toBeInTheDocument()
      expect(within(circle).getByText('G♯')).toBeInTheDocument()
      expect(within(circle).getByText('E♯m')).toBeInTheDocument()
      expect(within(circle).queryByText('A♭')).toBeNull()
    })

    it('shows a single spelling on an ambiguous sector that belongs to the key', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^E mayor/ }))

      const circle = screen.getByRole('radiogroup', { name: 'Tonalidades' })
      expect(screen.getByRole('radio', { name: 'B mayor, grado V' })).toBeInTheDocument()
      expect(within(circle).getByText('B')).toBeInTheDocument()
      expect(within(circle).queryByText('C♭')).toBeNull()
    })

    it('offers no alternate spelling for an unambiguous key', () => {
      renderShell()

      expect(within(keyPanel()).queryByRole('button', { name: /^Ver como/ })).toBeNull()
    })
  })

  describe('state in the URL', () => {
    const visit = (url: string) => window.history.replaceState(null, '', url)
    const chordPanel = () => screen.getByRole('region', { name: 'Acorde seleccionado' })
    const seventhsButton = () => within(keyPanel()).getByRole('button', { name: 'Séptimas' })

    it('restores the key, the chord kind and the open chord from the URL', () => {
      visit('/?key=G&mode=minor&chords=7th&chord=dorian.4')

      renderShell()

      expect(screen.getByRole('radio', { name: /^G menor/ })).toBeChecked()
      expect(seventhsButton()).toHaveAttribute('aria-pressed', 'true')
      expect(within(chordPanel()).getByRole('heading', { name: 'C7' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado IV7 · G dórico')).toBeInTheDocument()
    })

    it('falls back to C major for an invalid key, keeps the valid parameters and cleans the URL', () => {
      visit('/?key=H&chords=7th')

      renderShell()

      expect(screen.getByRole('radio', { name: /^C mayor/ })).toBeChecked()
      expect(seventhsButton()).toHaveAttribute('aria-pressed', 'true')
      expect(window.location.search).toBe('?chords=7th')
    })

    it('drops parameters it does not know, such as tracking ones', () => {
      visit('/?utm_source=newsletter&key=G&fbclid=abc')

      renderShell()

      expect(window.location.search).toBe('?key=G')
    })

    it('leaves the URL empty while everything is at its default', () => {
      renderShell()

      expect(window.location.search).toBe('')
    })

    it('writes the key picked on the circle', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^G mayor/ }))
      expect(window.location.search).toBe('?key=G')

      await user.click(screen.getByRole('radio', { name: /^A menor/ }))
      expect(window.location.search).toBe('?key=A&mode=minor')
    })

    it('writes the respelled key with its sharp encoded', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))
      expect(window.location.search).toBe('?key=F%23')

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' }))
      expect(window.location.search).toBe('?key=Gb')
    })

    it('writes the chord kind and the chord opened from either panel', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(seventhsButton())
      expect(window.location.search).toBe('?chords=7th')

      await user.click(within(keyPanel()).getByRole('button', { name: 'V7 G7' }))
      expect(window.location.search).toBe('?chords=7th&chord=key.5')

      const table = screen.getByRole('table', { name: /^Modos paralelos de/ })
      const dorian = within(table).getByRole('row', { name: /^Dórico/ })
      await user.click(within(dorian).getByRole('button', { name: /^IV7 F7/ }))
      expect(window.location.search).toBe('?chords=7th&chord=dorian.4')
    })

    it('drops the open chord from the URL when a new key loads its tonic', async () => {
      const user = userEvent.setup()
      visit('/?chord=key.5')
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^D mayor/ }))

      expect(window.location.search).toBe('?key=D')
    })

    it('keeps the path and the hash when it rewrites the query', async () => {
      const user = userEvent.setup()
      visit('/cheatsheet/?key=E#notes')
      renderShell()

      await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

      expect(window.location.pathname).toBe('/cheatsheet/')
      expect(window.location.search).toBe('?key=G')
      expect(window.location.hash).toBe('#notes')
    })

    it('replaces the history entry instead of adding one, so Back leaves the app', async () => {
      const user = userEvent.setup()
      renderShell()
      const entries = window.history.length

      await user.click(screen.getByRole('radio', { name: /^G mayor/ }))
      await user.click(seventhsButton())

      expect(window.history.length).toBe(entries)
    })
  })

  describe('language', () => {
    const languageSwitch = () => screen.getByRole('group', { name: /^(Idioma|Language)$/ })
    const languageButton = (name: string) => within(languageSwitch()).getByRole('button', { name })

    it('starts in Spanish with the switch on ES', () => {
      renderShell()

      expect(languageButton('Español')).toHaveAttribute('aria-pressed', 'true')
      expect(languageButton('English')).toHaveAttribute('aria-pressed', 'false')
      expect(document.documentElement.lang).toBe('es')
      expect(document.title).toBe('Círculo de Quintas')
    })

    it('shows the language codes and names each language in itself', () => {
      renderShell()

      // Read as words, not spelled out: "Español", "English", each in its own voice (lang).
      expect(languageButton('Español')).toHaveTextContent(/^ES$/)
      expect(languageButton('Español')).toHaveAttribute('lang', 'es')
      expect(languageButton('English')).toHaveTextContent(/^EN$/)
      expect(languageButton('English')).toHaveAttribute('lang', 'en')
    })

    it('switches the header, the key panel and the circle to English', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(languageButton('English'))

      expect(languageButton('English')).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.getByRole('heading', { level: 1, name: 'Circle of Fifths' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Circle of fifths' })).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: 'Keys' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'C major, degree I, no accidentals' })).toBeChecked()
      expect(
        screen.getByRole('radio', { name: 'F sharp or G flat major, 6 sharps or 6 flats' }),
      ).toBeInTheDocument()
      const key = screen.getByRole('region', { name: 'Selected key' })
      expect(within(key).getByRole('heading', { name: 'C major' })).toBeInTheDocument()
      expect(within(key).getByText('Key signature: no accidentals')).toBeInTheDocument()
      expect(within(key).getByRole('group', { name: 'Chord type' })).toBeInTheDocument()
      expect(within(key).getByRole('button', { name: 'Triads' })).toBeInTheDocument()
      expect(within(key).getByRole('button', { name: 'Sevenths' })).toBeInTheDocument()
      expect(within(key).getByRole('list', { name: 'Diatonic chords' })).toBeInTheDocument()
    })

    it('switches the chord panel and the modes table to English', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(languageButton('English'))

      const chord = screen.getByRole('region', { name: 'Selected chord' })
      expect(within(chord).getByRole('button', { name: 'Listen to C' })).toHaveTextContent(
        '▶ Listen',
      )
      expect(within(chord).getByText('Degree I · C major')).toBeInTheDocument()
      expect(within(chord).getByText('Notes: C E G')).toBeInTheDocument()
      expect(within(chord).getByText('Appears in:')).toBeInTheDocument()
      expect(
        within(within(chord).getByRole('list', { name: 'Modes containing it' }))
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Ionian I', 'Lydian I', 'Mixolydian I'])
      expect(within(chord).getByText('Loading diagram…')).toBeInTheDocument()

      const modes = screen.getByRole('region', { name: 'Modes' })
      const table = within(modes).getByRole('table', { name: 'Parallel modes of C' })
      expect(within(table).getByRole('columnheader', { name: 'Mode' })).toBeInTheDocument()
      expect(
        within(table).getByRole('columnheader', { name: 'Characteristic note' }),
      ).toBeInTheDocument()
      const ionian = within(table).getByRole('row', { name: /^Ionian/ })
      expect(within(ionian).getByText('none (reference)')).toBeInTheDocument()
      const dorian = within(table).getByRole('row', { name: /^Dorian/ })
      expect(within(dorian).getByText('major 6th (A)')).toBeInTheDocument()
      // Same row as the Spanish oracle above ('marks characteristic, borrowed and starred…').
      expect(
        within(dorian)
          .getAllByRole('button')
          .map((cell) => cell.textContent),
      ).toEqual([
        'i Cm (borrowed)',
        'ii Dm (characteristic)',
        '♭III E♭ (borrowed)',
        'IV F ⭐ (most representative) (characteristic)',
        'v Gm (borrowed)',
        'vi° A° (characteristic) (borrowed)',
        '♭VII B♭ (borrowed)',
      ])
      expect(within(modes).getByText(/^⭐ most representative/)).toHaveTextContent(
        '⭐ most representative · underlined: contains the characteristic note · ' +
          'dashed border: borrowed (differs from Ionian)',
      )
    })

    it('names a modal chord in English in the chord panel', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(languageButton('English'))
      const table = screen.getByRole('table', { name: 'Parallel modes of C' })
      const dorian = within(table).getByRole('row', { name: /^Dorian/ })

      await user.click(within(dorian).getByRole('button', { name: /^IV F/ }))

      const chord = screen.getByRole('region', { name: 'Selected chord' })
      expect(within(chord).getByText('Degree IV · C Dorian')).toBeInTheDocument()
    })

    it('names the respelling and the signature of an enharmonic key in English', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(languageButton('English'))

      await user.click(
        screen.getByRole('radio', { name: 'F sharp or G flat major, 6 sharps or 6 flats' }),
      )

      const key = screen.getByRole('region', { name: 'Selected key' })
      expect(
        within(key).getByText('Key signature: 6 sharps (F♯ C♯ G♯ D♯ A♯ E♯)'),
      ).toBeInTheDocument()
      expect(within(key).getByRole('button', { name: 'See as G♭ major' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'F sharp major, degree I, 6 sharps' })).toBeChecked()
    })

    it('describes the chord diagram in English', async () => {
      const user = userEvent.setup()
      renderShell({ voicings: loadVoicings })
      await user.click(languageButton('English'))
      const chord = screen.getByRole('region', { name: 'Selected chord' })

      expect(
        await within(chord).findByRole('img', {
          name: 'Diagram of C: strings 6th to 1st x 3 2 0 1 0',
        }),
      ).toBeInTheDocument()
      expect(within(chord).getByText('Position 1 of 4')).toBeInTheDocument()
      expect(within(chord).getByRole('button', { name: 'Previous position' })).toBeInTheDocument()

      await user.click(within(chord).getByRole('button', { name: 'Next position' }))

      expect(
        within(chord).getByRole('img', {
          name: 'Diagram of C: strings 6th to 1st 3 3 5 5 5 3, from fret 3',
        }),
      ).toBeInTheDocument()
    })

    it('marks the page as English and writes the language to the URL', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(languageButton('English'))

      expect(document.documentElement.lang).toBe('en')
      expect(document.title).toBe('Circle of Fifths')
      expect(window.location.search).toBe('?lang=en')
    })

    it('starts in English from the URL', () => {
      window.history.replaceState(null, '', '/?lang=en&key=G')

      renderShell()

      expect(languageButton('English')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('radio', { name: 'G major, degree I, 1 sharp' })).toBeChecked()
      expect(document.documentElement.lang).toBe('en')
    })

    it('goes back to Spanish and drops the language from the URL', async () => {
      const user = userEvent.setup()
      window.history.replaceState(null, '', '/?lang=en')
      renderShell()

      await user.click(languageButton('Español'))

      expect(
        screen.getByRole('heading', { level: 1, name: 'Círculo de Quintas' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('radio', { name: 'C mayor, grado I, sin alteraciones' }),
      ).toBeChecked()
      expect(document.documentElement.lang).toBe('es')
      expect(window.location.search).toBe('')
    })
  })

  describe('note names (C D E / Do Re Mi)', () => {
    const namesSwitch = () => screen.getByRole('group', { name: /^(Nombres de notas|Note names)$/ })
    const namesButton = (name: string) => within(namesSwitch()).getByRole('button', { name })
    const chordPanel = () => screen.getByRole('region', { name: 'Acorde seleccionado' })
    const modesTable = () => screen.getByRole('table', { name: /^Modos paralelos de/ })
    const dorianRow = () => within(modesTable()).getByRole('row', { name: /^Dórico/ })

    it('starts on letter names with the switch on C D E', () => {
      renderShell()

      expect(namesButton('C D E')).toHaveAttribute('aria-pressed', 'true')
      expect(namesButton('Do Re Mi')).toHaveAttribute('aria-pressed', 'false')
    })

    it('names the circle and the key panel in solfège', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(namesButton('Do Re Mi'))

      expect(namesButton('Do Re Mi')).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.getByRole('radio', { name: 'Do mayor, grado I, sin alteraciones' }),
      ).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Sol mayor, grado V' })).toHaveTextContent('Sol')
      expect(
        screen.getByRole('radio', {
          name: 'Fa sostenido o Sol bemol mayor, 6 sostenidos o 6 bemoles',
        }),
      ).toHaveTextContent('Fa♯Sol♭')
      expect(within(keyPanel()).getByRole('heading', { name: 'Do mayor' })).toBeInTheDocument()
      expect(chordList()).toEqual([
        'I Do',
        'ii Rem',
        'iii Mim',
        'IV Fa',
        'V Sol',
        'vi Lam',
        'vii° Si°',
      ])
    })

    it('names the key signature and the respelling in solfège', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(namesButton('Do Re Mi'))

      await user.click(
        screen.getByRole('radio', {
          name: 'Fa sostenido o Sol bemol mayor, 6 sostenidos o 6 bemoles',
        }),
      )

      expect(
        within(keyPanel()).getByText('Armadura: 6 sostenidos (Fa♯ Do♯ Sol♯ Re♯ La♯ Mi♯)'),
      ).toBeInTheDocument()
      expect(
        within(keyPanel()).getByRole('button', { name: 'Ver como Sol♭ mayor' }),
      ).toBeInTheDocument()
    })

    it('keeps the chord suffixes when sevenths are on', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(namesButton('Do Re Mi'))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Séptimas' }))

      expect(chordList()).toEqual([
        'Imaj7 Domaj7',
        'ii7 Rem7',
        'iii7 Mim7',
        'IVmaj7 Famaj7',
        'V7 Sol7',
        'vi7 Lam7',
        'viiø7 Sim7b5',
      ])
    })

    it('names the chord panel in solfège', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(namesButton('Do Re Mi'))

      await user.click(within(dorianRow()).getByRole('button', { name: /^♭III Mi♭/ }))

      expect(within(chordPanel()).getByRole('heading', { name: 'Mi♭' })).toBeInTheDocument()
      expect(within(chordPanel()).getByRole('button', { name: 'Escuchar Mi♭' })).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Grado ♭III · Do dórico')).toBeInTheDocument()
      expect(within(chordPanel()).getByText('Notas: Mi♭ Sol Si♭')).toBeInTheDocument()
    })

    it('names the modes table in solfège', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(namesButton('Do Re Mi'))

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de Do')
      expect(dorianRow()).toHaveTextContent('Do Re Mi♭ Fa Sol La Si♭')
      expect(within(dorianRow()).getByText('6ª mayor (La)')).toBeInTheDocument()
      expect(
        within(dorianRow())
          .getAllByRole('button')
          .map((cell) => cell.textContent),
      ).toEqual([
        'i Dom (prestado)',
        'ii Rem (característica)',
        '♭III Mi♭ (prestado)',
        'IV Fa ⭐ (más representativo) (característica)',
        'v Solm (prestado)',
        'vi° La° (característica) (prestado)',
        '♭VII Si♭ (prestado)',
      ])
    })

    it('names the chord diagram in solfège', async () => {
      const user = userEvent.setup()
      renderShell({ voicings: loadVoicings })

      await user.click(namesButton('Do Re Mi'))

      expect(
        await within(chordPanel()).findByRole('img', {
          name: 'Diagrama de Do: cuerdas de 6ª a 1ª x 3 2 0 1 0',
        }),
      ).toBeInTheDocument()
    })

    it('combines with English: solfège names, English words', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('button', { name: 'English' }))
      await user.click(namesButton('Do Re Mi'))

      expect(screen.getByRole('group', { name: 'Note names' })).toBeInTheDocument()
      expect(
        screen.getByRole('radio', { name: 'Do major, degree I, no accidentals' }),
      ).toBeChecked()
      expect(
        screen.getByRole('radio', { name: 'Fa sharp or Sol flat major, 6 sharps or 6 flats' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('table', { name: 'Parallel modes of Do' })).toBeInTheDocument()
    })

    it('writes the naming to the URL and restores it', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(namesButton('Do Re Mi'))
      expect(window.location.search).toBe('?names=solfege')

      await user.click(namesButton('C D E'))
      expect(window.location.search).toBe('')
    })

    it('starts in solfège from the URL', () => {
      window.history.replaceState(null, '', '/?names=solfege&key=G')

      renderShell()

      expect(namesButton('Do Re Mi')).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('radio', { name: 'Sol mayor, grado I, 1 sostenido' })).toBeChecked()
    })

    it('still plays the chord with its real spelling', async () => {
      const user = userEvent.setup()
      const played: string[][] = []
      renderShell({ audio: { playChord: (notes) => void played.push(notes) } })
      await user.click(namesButton('Do Re Mi'))

      await user.click(within(keyPanel()).getByRole('button', { name: 'V Sol' }))

      expect(played).toEqual([['G', 'B', 'D']])
    })
  })

  describe('theme', () => {
    // Fake at the browser boundary: jsdom has no matchMedia. `light` is the system preference.
    const fakeSystemTheme = (light: boolean) => {
      const listeners = new Set<(event: { matches: boolean }) => void>()
      const query = {
        matches: light,
        addEventListener: (_: 'change', listener: (event: { matches: boolean }) => void) =>
          void listeners.add(listener),
        removeEventListener: (_: 'change', listener: (event: { matches: boolean }) => void) =>
          void listeners.delete(listener),
      }
      vi.stubGlobal('matchMedia', (media: string) =>
        media === '(prefers-color-scheme: light)' ? query : { ...query, matches: false },
      )
      return {
        listeners: () => listeners.size,
        change: (next: boolean) =>
          act(() => {
            query.matches = next
            listeners.forEach((listener) => listener({ matches: next }))
          }),
      }
    }
    const themeSwitch = () => screen.getByRole('group', { name: /^(Tema|Theme)$/ })
    const themeButton = (name: string) => within(themeSwitch()).getByRole('button', { name })
    const html = document.documentElement

    beforeEach(() => localStorage.clear())
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
      localStorage.clear()
      html.removeAttribute('data-theme')
    })

    it('follows a dark system theme when nothing was chosen', () => {
      fakeSystemTheme(false)

      renderShell()

      expect(themeButton('Oscuro')).toHaveAttribute('aria-pressed', 'true')
      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'false')
      expect(html).toHaveAttribute('data-theme', 'dark')
    })

    it('follows a light system theme when nothing was chosen', () => {
      fakeSystemTheme(true)

      renderShell()

      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'light')
    })

    it('is dark when the browser cannot tell the system theme', () => {
      renderShell()

      expect(themeButton('Oscuro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'dark')
    })

    it('applies and remembers the chosen theme, outside the URL', async () => {
      const user = userEvent.setup()
      fakeSystemTheme(false)
      renderShell()

      await user.click(themeButton('Claro'))

      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'light')
      expect(localStorage.getItem('cheetsheet-guitar:theme')).toBe('light')
      expect(window.location.search).toBe('')
    })

    it('starts on the remembered theme over the system one', () => {
      fakeSystemTheme(true)
      localStorage.setItem('cheetsheet-guitar:theme', 'dark')

      renderShell()

      expect(themeButton('Oscuro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'dark')
    })

    it('ignores a remembered value that is not a theme', () => {
      fakeSystemTheme(true)
      localStorage.setItem('cheetsheet-guitar:theme', 'sepia')

      renderShell()

      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'light')
    })

    it('follows the system when it changes, until a theme is chosen', async () => {
      const user = userEvent.setup()
      const system = fakeSystemTheme(false)
      renderShell()

      system.change(true)
      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'light')

      await user.click(themeButton('Oscuro'))
      system.change(false)
      system.change(true)
      expect(themeButton('Oscuro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'dark')
    })

    it('stops following the system theme once the app is gone', () => {
      const system = fakeSystemTheme(false)
      const { unmount } = renderShell()
      expect(system.listeners()).toBe(1)

      unmount()

      expect(system.listeners()).toBe(0)
    })

    it('still works when the browser blocks storage', async () => {
      const user = userEvent.setup()
      fakeSystemTheme(false)
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
      renderShell()

      await user.click(themeButton('Claro'))

      expect(themeButton('Claro')).toHaveAttribute('aria-pressed', 'true')
      expect(html).toHaveAttribute('data-theme', 'light')
    })

    it('names the switch in English', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('button', { name: 'English' }))

      expect(themeButton('Dark')).toHaveAttribute('aria-pressed', 'true')
      expect(themeButton('Light')).toBeInTheDocument()
    })

    it('redraws the diagram with the new colors when the theme changes', async () => {
      const user = userEvent.setup()
      fakeSystemTheme(false)
      const drawn: number[][] = []
      renderShell({
        voicings: loadVoicings,
        drawDiagram: (_container, voicing) => void drawn.push(voicing.frets),
      })
      await screen.findByRole('img', { name: /^Diagrama de C/ })
      const before = drawn.length

      await user.click(themeButton('Claro'))

      expect(drawn).toHaveLength(before + 1)
      expect(drawn.at(-1)).toEqual([-1, 3, 2, 0, 1, 0])
    })
    it('applies the new theme before the diagram redraws, so it reads the new colors', async () => {
      const user = userEvent.setup()
      fakeSystemTheme(false)
      const themesAtDraw: Array<string | undefined> = []
      renderShell({
        voicings: loadVoicings,
        drawDiagram: () => void themesAtDraw.push(document.documentElement.dataset.theme),
      })
      await screen.findByRole('img', { name: /^Diagrama de C/ })

      await user.click(themeButton('Claro'))

      expect(themesAtDraw.at(-1)).toBe('light')
    })
  })

  describe('keyboard', () => {
    it('tabs through the page in visual order: header switches, circle, then the panels', async () => {
      const user = userEvent.setup()
      renderShell()
      const stops: string[] = []

      for (const _ of Array.from({ length: 8 })) {
        await user.tab()
        const focused = document.activeElement
        stops.push(focused?.getAttribute('aria-label') ?? focused?.textContent ?? '')
      }

      expect(stops).toEqual([
        'Español',
        'English',
        'C D E',
        'Do Re Mi',
        'Oscuro',
        'Claro',
        'C mayor, grado I, sin alteraciones',
        'Triadas',
      ])
    })

    it('selects the focused sector with Enter', async () => {
      const user = userEvent.setup()
      renderShell()
      screen.getByRole('radio', { name: /^A mayor/ }).focus()

      await user.keyboard('{Enter}')

      expect(within(keyPanel()).getByRole('heading', { name: 'A mayor' })).toBeInTheDocument()
    })

    it('selects the focused sector with Space', async () => {
      const user = userEvent.setup()
      renderShell()
      screen.getByRole('radio', { name: /^B menor/ }).focus()

      await user.keyboard(' ')

      expect(within(keyPanel()).getByRole('heading', { name: 'B menor' })).toBeInTheDocument()
    })

    it('puts only the selected sector in the tab order', async () => {
      const user = userEvent.setup()
      renderShell()
      // The header switches come first; start from the last of them.
      within(screen.getByRole('banner')).getAllByRole('button').at(-1)!.focus()

      await user.tab()
      expect(screen.getByRole('radio', { name: /^C mayor/ })).toHaveFocus()

      await user.tab()
      expect(screen.getAllByRole('radio', { name: / (mayor|menor)/ })).not.toContainEqual(
        document.activeElement,
      )
    })

    it('moves focus clockwise and counter-clockwise with the arrow keys', async () => {
      const user = userEvent.setup()
      renderShell()
      screen.getByRole('radio', { name: /^C mayor/ }).focus()

      await user.keyboard('{ArrowRight}')
      expect(screen.getByRole('radio', { name: /^G mayor/ })).toHaveFocus()

      await user.keyboard('{ArrowLeft}{ArrowLeft}')
      expect(screen.getByRole('radio', { name: /^F mayor/ })).toHaveFocus()
    })

    it('switches between the outer and inner ring with up and down', async () => {
      const user = userEvent.setup()
      renderShell()
      screen.getByRole('radio', { name: /^G mayor/ }).focus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('radio', { name: /^E menor/ })).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('radio', { name: /^G mayor/ })).toHaveFocus()
    })
  })
})
