import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export type Locale = 'en' | 'es'

const SPEECH_LANG: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

export interface UseLocaleResult {
  locale:       Locale
  speechLang:   string
  setLocale:    (next: Locale) => void
  toggleLocale: () => void
}

function normalizeLocale(lng: string): Locale {
  return lng.startsWith('es') ? 'es' : 'en'
}

export function useLocale(): UseLocaleResult {
  const { i18n } = useTranslation()
  const locale = normalizeLocale(i18n.language)

  const setLocale = useCallback((next: Locale) => {
    void i18n.changeLanguage(next)
  }, [i18n])

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