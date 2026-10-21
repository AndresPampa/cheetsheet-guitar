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

    expect(screen.getAllByRole('button', { name: /mayor/ })).toHaveLength(12)
    expect(screen.getAllByRole('button', { name: /menor/ })).toHaveLength(12)
  })

  it('names the enharmonic sectors with both spellings', () => {
    render(<KeyExplorer />)

    expect(screen.getByRole('button', { name: /^B o C bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^F sostenido o G bemol mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^D bemol o C sostenido mayor/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^D sostenido o E bemol menor/ })).toBeInTheDocument()
  })

  it('starts on C major with its diatonic triads', () => {
    render(<KeyExplorer />)

    expect(screen.getByRole('button', { name: /^C mayor/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(keyPanel()).getByRole('heading', { name: 'C mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: sin alteraciones')).toBeInTheDocument()
    expect(chordList()).toEqual(['I C', 'ii Dm', 'iii Em', 'IV F', 'V G', 'vi Am', 'vii° B°'])
  })

  it('selects a major key on click and shows its chords and signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('button', { name: /^G mayor/ }))

    expect(screen.getByRole('button', { name: /^G mayor/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^C mayor/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(within(keyPanel()).getByRole('heading', { name: 'G mayor' })).toBeInTheDocument()
    expect(within(keyPanel()).getByText('Armadura: 1 sostenido (F♯)')).toBeInTheDocument()
    expect(chordList()).toEqual(['I G', 'ii Am', 'iii Bm', 'IV C', 'V D', 'vi Em', 'vii° F♯°'])
  })

  it('marks the diatonic sectors of the selected key with their degree', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('button', { name: /^G mayor/ }))

    expect(screen.getByRole('button', { name: 'G mayor, grado I' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'C mayor, grado IV' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'D mayor, grado V' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'A menor, grado ii' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'B menor, grado iii' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'E menor, grado vi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'F mayor' })).toBeInTheDocument()
  })

  it('selects a minor key from the inner ring with minor-key numerals', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('button', { name: /^E menor/ }))

    expect(within(keyPanel()).getByRole('heading', { name: 'E menor' })).toBeInTheDocument()
    expect(chordList()).toEqual(['i Em', 'ii° F♯°', 'III G', 'iv Am', 'v Bm', 'VI C', 'VII D'])
  })

  it('uses the singular for a one-flat signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('button', { name: /^F mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 1 bemol (B♭)')).toBeInTheDocument()
  })

  it('lists flats in canonical order in the signature', async () => {
    const user = userEvent.setup()
    render(<KeyExplorer />)

    await user.click(screen.getByRole('button', { name: /^E bemol mayor/ }))

    expect(within(keyPanel()).getByText('Armadura: 3 bemoles (B♭ E♭ A♭)')).toBeInTheDocument()
  })

  describe('enharmonic spelling', () => {
    it('uses the sharp spelling for F#/Gb and offers the flat one', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

      await user.click(screen.getByRole('button', { name: /^F sostenido o G bemol mayor/ }))

      expect(within(keyPanel()).getByRole('heading', { name: 'F♯ mayor' })).toBeInTheDocument()
      expect(within(keyPanel()).getByRole('button', { name: 'Ver como G♭ mayor' })).toBeVisible()
    })

    it('respells the whole key when switching to the alternate spelling', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      await user.click(screen.getByRole('button', { name: /^D bemol o C sostenido mayor/ }))

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
      expect(screen.getByRole('button', { name: /^D bemol o C sostenido mayor/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(within(keyPanel()).getByRole('button', { name: 'Ver como D♭ mayor' })).toBeVisible()
    })

    it('offers no alternate spelling for an unambiguous key', () => {
      render(<KeyExplorer />)

      expect(within(keyPanel()).queryByRole('button', { name: /^Ver como/ })).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('selects the focused sector with Enter and with Space', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)

      screen.getByRole('button', { name: /^A mayor/ }).focus()
      await user.keyboard('{Enter}')
      expect(within(keyPanel()).getByRole('heading', { name: 'A mayor' })).toBeInTheDocument()

      screen.getByRole('button', { name: /^B menor/ }).focus()
      await user.keyboard(' ')
      expect(within(keyPanel()).getByRole('heading', { name: 'B menor' })).toBeInTheDocument()
    })

    it('moves focus clockwise and counter-clockwise with the arrow keys', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('button', { name: /^C mayor/ }).focus()

      await user.keyboard('{ArrowRight}')
      expect(screen.getByRole('button', { name: /^G mayor/ })).toHaveFocus()

      await user.keyboard('{ArrowLeft}{ArrowLeft}')
      expect(screen.getByRole('button', { name: /^F mayor/ })).toHaveFocus()
    })

    it('switches between the outer and inner ring with up and down', async () => {
      const user = userEvent.setup()
      render(<KeyExplorer />)
      screen.getByRole('button', { name: /^G mayor/ }).focus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('button', { name: /^E menor/ })).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('button', { name: /^G mayor/ })).toHaveFocus()
    })
  })
})
