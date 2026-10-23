import { createContext, useContext } from 'react'
import { en } from './en.ts'
import { es } from './es.ts'
import type { Language, Messages } from './messages.ts'

export type { Language, Messages } from './messages.ts'
export { displayRoman, displaySymbol } from './notation.ts'

const DICTIONARIES: Record<Language, Messages> = { es, en }

export function getMessages(language: Language): Messages {
  return DICTIONARIES[language]
}

/** The current dictionary; Spanish when no provider is above (the app's default). */
export const MessagesContext = createContext<Messages>(es)

export function useMessages(): Messages {
  return useContext(MessagesContext)
}
