import { useCallback, useEffect, useState } from 'react'
import { parseState, serializeState, type AppState } from './url.ts'

/**
 * The app state, read from the URL once and written back on every change. It replaces the
 * history entry instead of pushing one, so Back leaves the app. Path and hash are kept.
 */
export function useUrlState(): [AppState, (patch: Partial<AppState>) => void] {
  const [state, setState] = useState(() => parseState(window.location.search))

  // Also runs on the first render, so parameters that fell back to a default are cleaned. The
  // query is rewritten whole: parameters the app does not know (`utm_*`, `fbclid`) are dropped.
  useEffect(() => {
    const { pathname, hash } = window.location
    window.history.replaceState(window.history.state, '', pathname + serializeState(state) + hash)
  }, [state])

  const update = useCallback(
    (patch: Partial<AppState>) => setState((current) => ({ ...current, ...patch })),
    [],
  )
  return [state, update]
}
