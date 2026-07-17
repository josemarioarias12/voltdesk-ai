import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import commonEs from './locales/es/common.json'
import ticketsEn from './locales/en/tickets.json'
import ticketsEs from './locales/es/tickets.json'

export const STORAGE_KEY = 'voltdesk_locale'
export const defaultNS = 'common'

export const resources = {
  en: {
    common: commonEn,
    tickets: ticketsEn,
  },
  es: {
    common: commonEs,
    tickets: ticketsEs,
  },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS,
    ns: Object.keys(resources.en),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n