import { createContext, useContext } from 'react'
import { en } from './en.ts'
import { es } from './es.ts'
import type { Language, Messages } from './messages.ts'
import type { Notation } from './notation.ts'

export type { Language, Messages } from './messages.ts'
export type { Notation } from './notation.ts'
export { displayRoman } from './notation.ts'

const DICTIONARIES: Record<Language, (notation: Notation) => Messages> = { es, en }
// One object per combination, built once: a stable identity for React effects and context.
const cache = new Map<string, Messages>()

export function getMessages(language: Language, notation: Notation = 'letters'): Messages {
  const key = `${language}/${notation}`
  let messages = cache.get(key)
  if (messages === undefined) {
    messages = DICTIONARIES[language](notation)
    cache.set(key, messages)
  }
  return messages
}

/** The current dictionary; Spanish with letter names when no provider is above (the defaults). */
export const MessagesContext = createContext<Messages>(getMessages('es'))

export function useMessages(): Messages {
  return useContext(MessagesContext)
}
