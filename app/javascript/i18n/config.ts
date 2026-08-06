import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import commonEs from './locales/es/common.json'
import ticketsEn from './locales/en/tickets.json'
import ticketsEs from './locales/es/tickets.json'
import hrEn from './locales/en/hr.json'
import hrEs from './locales/es/hr.json'
import departmentsEn from './locales/en/departments.json'
import departmentsEs from './locales/es/departments.json'
import demoEn from './locales/en/demo.json'
import demoEs from './locales/es/demo.json'
import dashboardEn from './locales/en/dashboard.json'
import dashboardEs from './locales/es/dashboard.json'
import settingsEn from './locales/en/settings.json'
import settingsEs from './locales/es/settings.json'

export const STORAGE_KEY = 'voltdesk_locale'
export const defaultNS = 'common'

export const resources = {
  en: {
    common: commonEn,
    tickets: ticketsEn,
    departments: departmentsEn,
    demo: demoEn,
    hr: hrEn,
    dashboard: dashboardEn,
    settings: settingsEn,
  },
  es: {
    common: commonEs,
    tickets: ticketsEs,
    departments: departmentsEs,
    demo: demoEs,
    hr: hrEs,
    dashboard: dashboardEs,
    settings: settingsEs,
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
      order: ['localStorage', 'cookie', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      lookupCookie: STORAGE_KEY,
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 60 * 24 * 365,
      cookieOptions: { path: '/', sameSite: 'lax' },
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n