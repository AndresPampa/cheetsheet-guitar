import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

// A device preference, not part of a shared link: it lives in localStorage, not in the URL.
const STORAGE_KEY = 'cheetsheet-guitar:theme'
const LIGHT_QUERY = '(prefers-color-scheme: light)'

// Storage can throw (blocked cookies, some private modes): the theme then lasts the session.
function readChoice(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

function saveChoice(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Not remembered across visits; still applied now.
  }
}

// Dark is the base design: also the answer when the browser cannot tell (no matchMedia).
const systemQuery = (): MediaQueryList | undefined =>
  typeof window.matchMedia === 'function' ? window.matchMedia(LIGHT_QUERY) : undefined
const systemTheme = (): Theme => (systemQuery()?.matches === true ? 'light' : 'dark')

/**
 * The theme in use: the remembered choice, or else the system's, followed live while nothing
 * was chosen. A choice is written as `data-theme` on `<html>`; without one the CSS follows
 * `prefers-color-scheme` by itself.
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [choice, setChoice] = useState(readChoice)
  const [system, setSystem] = useState(systemTheme)

  useEffect(() => {
    const query = systemQuery()
    if (query === undefined) return
    const follow = (event: { matches: boolean }) => setSystem(event.matches ? 'light' : 'dark')
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])

  useEffect(() => {
    if (choice === null) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.dataset.theme = choice
  }, [choice])

  const choose = (theme: Theme) => {
    saveChoice(theme)
    setChoice(theme)
  }
  return [choice ?? system, choose]
}
