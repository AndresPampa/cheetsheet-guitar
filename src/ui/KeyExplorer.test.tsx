import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { KeyExplorer } from './KeyExplorer.tsx'

const keyPanel = () => screen.getByRole('region', { name: 'Tonalidad seleccionada' })
const chordList = () =>
  within(keyPanel())
    .getAllByRole('listitem')
    .map((item) => item.textContent)

describe('KeyExplorer', () => {
  it('draws 12 major and 12 minor sectors', () => {
    render(<KeyExplorer />)

    expect(screen.getAllByRole('radio', { name: /mayor/ })).toHaveLength(12)
    expect(screen.getAllByRole('radio', { name: /menor/ })).toHaveLength(12)
  })

  it('names the enharmonic sectors with both spellings', () => {
    render(<KeyExplorer />)

    expect(screen.getByRole('radio', { name: /^B o C bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^D bemol o C sostenido mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^D sostenido o E bemol menor/ })).toBeInTheDocument()
  })

  it('starts on C major with its diatonic triads', () => {
    render(<KeyExplorer />)

    expect(screen.getByRole('radio', { name: /^C mayor/ })).toBeChecked()
    expect(within(keyPanel()).getByRole('heading', { name: 'C mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: sin alteraciones')).toBeInTheDocument()
    expect(chordList()).toEqual(['I C', 'ii Dm', 'iii Em', 'IV F', 'V G', 'vi Am', 'vii° B°'])
  })

  it('selects a major key on click and shows its chords and signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    expect(screen.getByRole('radio', { name: /^G mayor/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^C mayor/ })).not.toBeChecked()
    expect(within(keyPanel()).getByRole('heading', { name: 'G mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: 1 sostenido (F♯)')).toBeInTheDocument()
    expect(chordList()).toEqual(['I G', 'ii Am', 'iii Bm', 'IV C', 'V D', 'vi Em', 'vii° F♯°'])
  })

  it('marks the diatonic sectors of the selected key with their degree', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    expect(screen.getByRole('radio', { name: 'G mayor, grado I' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'C mayor, grado IV' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'D mayor, grado V' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'A menor, grado ii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'B menor, grado iii' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'E menor, grado vi' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'F mayor' })).toBeInTheDocument()
  })

  it('leaves the diminished chord off the circle', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^G mayor/ }))

    expect(screen.getByRole('radio', { name: 'F sostenido menor' })).toBeInTheDocument()
  })

  it('selects a minor key from the inner ring with minor-key numerals', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^E menor/ }))

    expect(within(keyPanel()).getByRole('heading', { name: 'E menor' })).toBeInTheDocument()
    expect(chordList()).toEqual(['i Em', 'ii° F♯°', 'III G', 'iv Am', 'v Bm', 'VI C', 'VII D'])
  })

  it('uses the singular for a one-flat signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^F mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 1 bemol (B♭)')).toBeInTheDocument()
  })

  it('lists flats in canonical order in the signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('radio', { name: /^E bemol mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 3 bemoles (B♭ E♭ A♭)')).toBeInTheDocument()
  })

  describe('triads / sevenths switch', () => {
    const triadsButton = () => within(keyPanel()).getByRole('button', { name: 'Triadas' })
    const seventhsButton = () => within(keyPanel()).getByRole('button', { name: 'Séptimas' })

    it('starts on triads', () => {
      render(<KeyExplorer />)

      expect(triadsButton()).toHaveAttribute('aria-pressed', 'true')
      expect(seventhsButton()).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows the diatonic seventh chords when switched to sevenths', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

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
      render(<KeyExplorer />)
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
      render(<KeyExplorer />)
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
      render(<KeyExplorer />)
      await user.click(seventhsButton())

      await user.click(triadsButton())

      expect(chordList()).toEqual(['I C', 'ii Dm', 'iii Em', 'IV F', 'V G', 'vi Am', 'vii° B°'])
    })

    it('leaves the circle labelled with triads', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

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
      render(<KeyExplorer />)

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de C')
      expect(
        within(modesTable())
          .getAllByRole('rowheader')
          .map((header) => header.firstChild?.textContent),
      ).toEqual(['Jónico', 'Dórico', 'Frigio', 'Lidio', 'Mixolidio', 'Eólico', 'Locrio'])
    })

    it('shows each mode with its scale and characteristic note', () => {
      render(<KeyExplorer />)

      expect(modeRow('Dórico')).toHaveTextContent('C D E♭ F G A B♭')
      expect(characteristicOf('Dórico')).toHaveTextContent('6ª mayor (A)')
      expect(characteristicOf('Frigio')).toHaveTextContent('♭2 (D♭)')
      expect(characteristicOf('Lidio')).toHaveTextContent('♯4 (F♯)')
      expect(characteristicOf('Jónico')).toHaveTextContent('—')
    })

    it('marks characteristic, borrowed and starred chords on each degree', () => {
      render(<KeyExplorer />)

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

    it('writes raised degrees with a sharp sign (lydian)', () => {
      render(<KeyExplorer />)

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
      render(<KeyExplorer />)
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
      render(<KeyExplorer />)

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
      render(<KeyExplorer />)
      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))

      await user.click(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' }))

      expect(modesTable()).toHaveAccessibleName('Modos paralelos de G♭')
      expect(modeRow('Locrio')).toHaveTextContent('G♭ A♭♭ B♭♭ C♭ D♭♭ E♭♭ F♭')
    })

    it('follows the triads / sevenths switch', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

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

  describe('enharmonic spelling', () => {
    it('uses the sharp spelling for F#/Gb and offers the flat one', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

      await user.click(screen.getByRole('radio', { name: /^F sostenido o G bemol mayor/ }))

      expect(within(keyPanel()).getByRole('heading', { name: 'F♯ mayor' })).toBeInTheDocument()
      expect(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' })).toBeVisible()
    })

    it('respells the whole key when switching to the alternate spelling', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
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
      render(<KeyExplorer />)
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
      render(<KeyExplorer />)

      await user.click(screen.getByRole('radio', { name: /^E mayor/ }))

      const circle = screen.getByRole('radiogroup', { name: 'Tonalidades' })
      expect(screen.getByRole('radio', { name: 'B mayor, grado V' })).toBeInTheDocument()
      expect(within(circle).getByText('B')).toBeInTheDocument()
      expect(within(circle).queryByText('C♭')).toBeNull()
    })

    it('offers no alternate spelling for an unambiguous key', () => {
      render(<KeyExplorer />)

      expect(within(keyPanel()).queryByRole('button', { name: /^Ver como/ })).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('selects the focused sector with Enter', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('radio', { name: /^A mayor/ }).focus()

      await user.keyboard('{Enter}')

      expect(within(keyPanel()).getByRole('heading', { name: 'A mayor' })).toBeInTheDocument()
    })

    it('selects the focused sector with Space', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('radio', { name: /^B menor/ }).focus()

      await user.keyboard(' ')

      expect(within(keyPanel()).getByRole('heading', { name: 'B menor' })).toBeInTheDocument()
    })

    it('puts only the selected sector in the tab order', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

      await user.tab()
      expect(screen.getByRole('radio', { name: /^C mayor/ })).toHaveFocus()

      await user.tab()
      expect(screen.getAllByRole('radio', { name: / (mayor|menor)/ })).not.toContainEqual(
        document.activeElement,
      )
    })

    it('moves focus clockwise and counter-clockwise with the arrow keys', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('radio', { name: /^C mayor/ }).focus()

      await user.keyboard('{ArrowRight}')
      expect(screen.getByRole('radio', { name: /^G mayor/ })).toHaveFocus()

      await user.keyboard('{ArrowLeft}{ArrowLeft}')
      expect(screen.getByRole('radio', { name: /^F mayor/ })).toHaveFocus()
    })

    it('switches between the outer and inner ring with up and down', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('radio', { name: /^G mayor/ }).focus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('radio', { name: /^E menor/ })).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('radio', { name: /^G mayor/ })).toHaveFocus()
    })
  })
})
