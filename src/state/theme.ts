import { useEffect, useLayoutEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

// A device preference, not part of a shared link: it lives in localStorage, not in the URL.
// The inline script in index.html repeats this key and rule to set the theme before first paint.
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
 * was chosen. Always written as `data-theme` on `<html>`, which is all the CSS reads.
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

  // A layout effect runs before every passive one, children's included: the diagram, which
  // reads the colors when it draws, already sees the new theme.
  const theme = choice ?? system
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const choose = (next: Theme) => {
    saveChoice(next)
    setChoice(next)
  }
  return [theme, choose]
}
