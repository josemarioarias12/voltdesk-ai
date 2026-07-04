import { useState, useCallback } from 'react'

export type Locale = 'en' | 'es'

const STORAGE_KEY = 'voltdesk_locale'

// Maps our simple locale codes to the BCP-47 tags Web Speech API expects.
// Kept separate from the Locale type itself so the rest of the app never
// needs to know about speech-recognition-specific formatting.
const SPEECH_LANG: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'es' ? 'es' : 'en'
}

export interface UseLocaleResult {
  locale:       Locale
  speechLang:   string
  setLocale:    (next: Locale) => void
  toggleLocale: () => void
}

// Single source of truth for the user's language preference across the app.
// Today it only drives Web Speech API recognition language. When full i18n
// lands, UI text lookups read from this same hook — no consuming component
// (Tickets/New, Demo/CreateTicket, etc.) needs to change, only where this
// hook persists its state (localStorage today, User#locale column later).
export function useLocale(): UseLocaleResult {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'es' : 'en')
  }, [locale, setLocale])

  return {
    locale,
    speechLang: SPEECH_LANG[locale],
    setLocale,
    toggleLocale,
  }
}