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
