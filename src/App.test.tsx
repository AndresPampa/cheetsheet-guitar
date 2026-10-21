import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('shows the app title as the main heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Círculo de Quintas' }),
    ).toBeInTheDocument()
  })

  it.each(['Círculo de quintas', 'Modos', 'Acorde seleccionado'])(
    'shows the "%s" panel as a labelled region',
    (name) => {
      render(<App />)

      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    },
  )
})
