import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
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

    expect(screen.getByRole('radio', { name: 'G mayor, grado I' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'C mayor, grado IV' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'D mayor, grado V' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'A menor, grado ii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B menor, grado iii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'E menor, grado vi' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'F mayor' })).toBeInTheDocument()
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
    expect(screen.getByRole('radio', { name: 'F sostenido menor' })).toBeInTheDocument()
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
      expect(screen.getByRole('radio', { name: 'C sostenido mayor, grado I' })).toBeChecked()
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

  describe('keyboard', () => {
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
